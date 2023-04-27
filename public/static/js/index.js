import { updateBarCharts } from './bar-charts.js';

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

const chartWidth = 800;
const chartHeight = 800;

export let selectedMunicipalities = [];

const mapObj = await getMap();
const libraryStats = await getLibraryStatistics();
const statsCsv = d3.csvParse(libraryStats)

const municipalityCodeToDataMap = initmunicipalityCodeToDataMap();
const municipalityCodeToNameMap = initMunicipalityCodeToNameMap();

export const colorScale = createColorScale();

function initmunicipalityCodeToDataMap() {
    const municipalityCodeToDataMap = new Map();
    statsCsv.forEach(function(d) {
        municipalityCodeToDataMap.set(d.municipality_code, +d.loans_per_population_2022);
    });
    return municipalityCodeToDataMap;
}

function initMunicipalityCodeToNameMap() {
    const municipalityCodeToNameMap = new Map();
    statsCsv.forEach(function(d) {
        municipalityCodeToNameMap.set(d.municipality_code, d.municipality_name);
    });
    return municipalityCodeToNameMap;
}

// End defining global variables

async function initMap() {

    const standardParallels = [63, 66];
    const projection = createProjection(standardParallels);

    const onHoverInfo = createOnHoverInfo();

    const svg = d3.select("#map-and-legend-container")
      .append("svg")
      .attr("height", chartHeight)
      .attr("width", chartWidth)

    const g = svg.append("g");

    drawPaths(g, projection, colorScale, onHoverInfo);
    handleZoom(g, svg);
    createLegend(svg, colorScale);
    initPanningListener(svg);
    svg.on("dblclick.zoom", null); // Disable zooming on double click
}

function createLegend(svg, colorScale) {
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(20, 50)");

    legend.selectAll("rect")
        .data([30, 20, 10, 0])
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", function(d, i) { return i * 20; })
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", function(d) { return colorScale(d); });

    legend.selectAll("text")
        .data([30, 20, 10, 0])
        .enter()
        .append("text")
        .attr("x", 30)
        .attr("y", function(d, i) { return i * 20 + 15; })
        .text(function(d) { return d; }) 
        .style("font-size", "12px");
}

function createOnHoverInfo() {
    return d3.select("#hover-info-container")
      .append("div")
      .attr("class", "hover-info")
      .style("color", "black")
      .style("pointer-events", "none")
      .style("background-color", "#fff")
      .style("padding", "4px")
      .style("font-size", "20px");
}

function handleZoom(g, svg) {
    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", zoomed);

    function zoomed(event) {
        g.attr("transform", event.transform);
    }

    svg.call(zoom);
}

function createColorScale() {
    return d3.scaleSequential()
      .interpolator(d3.interpolateBlues)
      .domain([0, d3.max(statsCsv, function(d) { return +d.loans_per_population_2022; })]);
}

function createProjection(standardParallels) {
    return d3.geoConicEqualArea()
      .parallels(standardParallels)
      .rotate([-27, 0])
      .fitSize([chartWidth, chartHeight], mapObj);
}

function initPanningListener(svg) {
    // Not working (why)?
    svg.on('mousedown', function() {
       cursor: "-webkit-grabbing";
    });

    svg.on('mouseup', function() {
      cursor: "default";
    });
}

function drawPaths(g, projection, colorScale, onHoverInfo) {
    const path = d3.geoPath()
      .projection(projection);

    g
      .selectAll("path")
      .data(mapObj.features)
      .enter()
      .append("path")
      .attr("class", "municipality")
      .attr("d", path)
      .attr("stroke", "black")
      .style("fill", function(d) {
            var municipalityCode = d.properties.code;
            var dataValue = municipalityCodeToDataMap.get(municipalityCode);
            if(dataValue) {
                return colorScale(dataValue);
            } else {
                return '#ffffff';
            }
            
          })
      .on('mouseover', function(event, d) {
        onHoverInfo
          .html(d.properties.name);
      })
      .on('click', onMunicipalityClick)
      .text(function(d) { return d.properties.name; });
}

function onMunicipalityClick(event, d) {
    const municipalityCode = d.properties.code;
    console.log("clicked " + municipalityCode)
    const alreadySelected = selectedMunicipalities.filter(municipality => municipality.code == municipalityCode).length > 0;
    console.log("already Selected " + alreadySelected)
    if(alreadySelected) {
        removeSelectedMunicipality(event, d);
    } else {
        addSelectedMunicipality(event, d);
    }
    updateBarCharts();
    //event.stopPropagation();
}

function addSelectedMunicipality(event, d) {
    console.log("addSelectedMunicipality " + d.properties.code)
    const municipalityCode = d.properties.code;
    const municipalityName = d.properties.name;

    const dataValue = municipalityCodeToDataMap.get(municipalityCode);
    selectedMunicipalities.push({'code': municipalityCode, 'name': municipalityName, 'value': dataValue});

    const clickedPath = d3.select(event.currentTarget);
    clickedPath.classed('highlighted', true);
}

function removeSelectedMunicipality(event, d) {
    console.log("removeSelectedMunicipality " + d.properties.code)
    const municipalityCode = d.properties.code;

    removeSelectedMunicipalityByCode(municipalityCode);

    const clickedPath = d3.select(event.currentTarget);
    clickedPath.classed('highlighted', false);
}

function removeSelectedMunicipalityByCode(municipalityCode) {
    let i = 0;
    console.log("municipalityCode " + municipalityCode);
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

initMap();