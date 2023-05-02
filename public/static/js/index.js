import { updateBarCharts, updateBarChartsYear, clearBarCharts } from './bar-charts.js';

async function getMap() {
    try {
        const response = await axios.get('http://localhost:3000/resources/finland-map-latest.json');
        return response.data;
    } catch (error) {
        console.error(error);
    }
}

async function getLibraryStatistics() {
    try {
        const response = await axios.get('http://localhost:3000/resources/library_stats_all_clean.csv', 
            { responseType: 'blob'});
        const csvData = response.data;
        return csvData.text();
    } catch (error) {
        console.error(error);
    }
}

// Defining global variables

const yearsArr = ["2016", "2017", "2018", "2019", "2020", "2021", "2022"];

export let currentYear = getLatestYearWithData();

const chartWidth = 800;
const chartHeight = 800;

export let selectedMunicipalities = [];

const mapObj = await getMap();
const libraryStats = await getLibraryStatistics();
const statsCsv = d3.csvParse(libraryStats);

const municipalityCodeToDataMap = initmunicipalityCodeToDataMap();
const municipalityCodeToNameMap = initMunicipalityCodeToNameMap();

export const colorScale = createColorScale();

const municipalityNameTooltip = createMunicipalityNameTooltip();

const projection = createProjection();

const mapSvg = initMapSvg();
const mapG = mapSvg.append("g");

d3.select("#header-year-label").html(currentYear);

drawPaths(currentYear);
handleZoom();
createLegend();
initEmptySelectionsButton();
initYearSlider();

function initmunicipalityCodeToDataMap() {
    const municipalityCodeToDataMap = new Map();
    statsCsv.forEach(function(d) {
        for(let year of yearsArr) {
            let yearColumnKey = "loans_per_population_" + year;
            let mapKey = getMunicipalityCodeToYearKey(d.municipality_code, year);
            municipalityCodeToDataMap.set(mapKey, d[yearColumnKey]);
        }
    });
    console.log(municipalityCodeToDataMap)
    return municipalityCodeToDataMap;
}

function initMunicipalityCodeToNameMap() {
    const municipalityCodeToNameMap = new Map();
    statsCsv.forEach(function(d) {
        municipalityCodeToNameMap.set(d.municipality_code, d.municipality_name);
    });
    return municipalityCodeToNameMap;
}

export function getMunicipalityCodeToYearKey(code, year) {
    return code + "_" + year;
}

// End defining global variables

function initMapSvg() {
    return d3.select("#map-and-legend-container")
      .append("svg")
      .attr("height", chartHeight)
      .attr("width", chartWidth);
}

function createLegend() {
    const legend = mapSvg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(20, 50)");

    legend.selectAll("rect")
        .data([25, 20, 15, 10, 5])
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", function(d, i) { return i * 20; })
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", function(d) { return colorScale(d); });

    legend.selectAll("text")
        .data([25, 20, 15, 10, 5])
        .enter()
        .append("text")
        .attr("x", 30)
        .attr("y", function(d, i) { return i * 20 + 15; })
        .text(function(d) { return d; }) 
        .style("font-size", "12px");
}

function createMunicipalityNameTooltip() {
    return d3.select("body")
      .append("div")
      .attr("class", "hover-tooltip")
      .attr("id", "municipality-name-tooltip");
}

function handleZoom() {
    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", zoomed);

    function zoomed(event) {
        mapG.attr("transform", event.transform);
    }
    mapSvg.call(zoom);
    mapSvg.on("dblclick.zoom", null); // Disable zooming on double click
}

function createColorScale() {
    const color_domain = [5, 10, 15, 20, 25];
    const color_range = ['#f1eef6', '#d0d1e6', '#a6bddb', '#74a9cf', '#2b8cbe', '#045a8d'];
    return d3.scaleThreshold()
        .range(color_range)
        .domain(color_domain);
}

function createProjection() {
    const standardParallels = [63, 66];
    return d3.geoConicEqualArea()
      .parallels(standardParallels)
      .rotate([-27, 0])
      .fitSize([chartWidth, chartHeight], mapObj);
}

function initEmptySelectionsButton() {
    d3.select("#clear-selections-button").on("click", function(){
        clearSelections();
    })
}

function drawPaths() {
    const path = d3.geoPath()
      .projection(projection);

    mapG
      .selectAll("path")
      .remove();

    mapG
      .selectAll("path")
      .data(mapObj.features)
      .enter()
      .append("path")
      .attr("class", "municipality")
      .attr("d", path)
      .attr("stroke", "black")
      .style("fill", function(d) {
            var municipalityCode = d.properties.code;
            var mapKey = getMunicipalityCodeToYearKey(municipalityCode, currentYear);
            var dataValue = municipalityCodeToDataMap.get(mapKey);
            if(dataValue) {
                return colorScale(dataValue);
            } else {
                return '#ffffff';
            }
            
          })
      .on('mouseover', function(event, d) {
        municipalityNameTooltip
          .html(d.properties.name)
          .style('visibility', 'visible');
      })
      .on('mousemove', function(event) {
          municipalityNameTooltip
            .style('top', (event.clientY - 15) + 'px')
            .style('left', (event.clientX + 15) + 'px');
      })
      .on('mouseout', function () {
          municipalityNameTooltip.html('').style('visibility', 'hidden');
      })
      .on('click', onMunicipalityClick)
      .text(function(d) { return d.properties.name; });

    highlightSelectedMunicipalities();
}

function highlightSelectedMunicipalities() {
    mapG
      .selectAll("path")
      .each(function(d) {
        const municipality = d3.select(this);
        if(municipalityIsSelected(d.properties.code)) {
            municipality.classed("highlighted", true);
        }
      })
}

function onMunicipalityClick(event, d) {
    const municipalityCode = d.properties.code;
    if(municipalityIsSelected(municipalityCode)) {
        removeSelectedMunicipality(event, d);
    } else {
        addSelectedMunicipality(event, d);
    }
    updateBarCharts(currentYear);
}

function municipalityIsSelected(code) {
    return selectedMunicipalities.filter(municipality => municipality.code == code).length > 0;
}

function addSelectedMunicipality(event, d) {
    selectedMunicipalities.push(createSelectedMunicipalityObj(d));

    const clickedPath = d3.select(event.currentTarget);
    clickedPath.classed('highlighted', true);
}

function createSelectedMunicipalityObj(d) {
    const municipalityCode = d.properties.code;
    const municipalityName = d.properties.name;

    const dataValue = municipalityCodeToDataMap.get(municipalityCode);
    const selectedMunicipalityWithData =
        {
            'code': municipalityCode, 
            'name': municipalityName, 
            'yearData': {}
        }
    yearsArr.forEach(function(year) {
        const mapKey = getMunicipalityCodeToYearKey(municipalityCode, year);
        selectedMunicipalityWithData.yearData[year] = municipalityCodeToDataMap.get(mapKey);
    });
    return selectedMunicipalityWithData;
}

function clearSelections() {
    selectedMunicipalities = [];
    mapSvg
      .selectAll(".municipality")
      .classed("highlighted", false);
    clearBarCharts();
}

function removeSelectedMunicipality(event, d) {
    const municipalityCode = d.properties.code;

    removeSelectedMunicipalityByCode(municipalityCode);

    const clickedPath = d3.select(event.currentTarget);
    clickedPath.classed('highlighted', false);
}

function removeSelectedMunicipalityByCode(municipalityCode) {
    let i = 0;
    const newSelectedMunicipalities = selectedMunicipalities;
    while (i < newSelectedMunicipalities.length) {
        if (newSelectedMunicipalities[i].code === municipalityCode) {
          newSelectedMunicipalities.splice(i, 1);
          break;
        } else {
          ++i;
        }
    }
    selectedMunicipalities = newSelectedMunicipalities;
}

function initYearSlider() {
    const slider = d3.select("#year-slider");
    const sliderLabel = d3.select("#year-slider-current-year-label");
    const headerYearLabel = d3.select("#header-year-label");
    sliderLabel.html(getLatestYearWithData());

    slider.on("input", function() {
      let year = this.value;
      currentYear = year;
      sliderLabel.text(year);
      headerYearLabel.text(year);
      transitionMap();
    });
}

function getLatestYearWithData() {
    return yearsArr[yearsArr.length - 1];
}

function transitionMap() {
    drawPaths();
    updateBarChartsYear();
}