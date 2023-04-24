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

const barChartMargin = { top: 20, right: 20, bottom: 20, left: 20 };
const barChartWidth = 250;
const barChartHeight = 200;

const mapObj = await getMap();
const libraryStats = await getLibraryStatistics();
const statsCsv = d3.csvParse(libraryStats)

const municipalityCodeToDataMap = initmunicipalityCodeToDataMap();
const municipalityCodeToNameMap = initMunicipalityCodeToNameMap();

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

const selectedMunicipalities = new Set();

// End defining global variables

async function initMap() {
    const colorScale = createColorScale();

    const standardParallels = [63, 66];
    const projection = createProjection(standardParallels);

    const onHoverInfo = createOnHoverInfo();

    const svg = d3.select("#map-container")
      .append("svg")
      .attr("height", chartHeight)
      .attr("width", chartWidth)

    const g = svg.append("g");

    drawPaths(g, projection, colorScale, onHoverInfo);
    handleZoom(g, svg);
    createLegend(svg, colorScale);
    initPanningListener(svg);
}

function initBarCharts() {
    d3.select('#charts-container')
      .append('svg')
      .attr('width', barChartWidth + barChartMargin.left + barChartMargin.right)
      .attr('height', barChartHeight + barChartMargin.top + barChartMargin.bottom)
      .append('g')
      .attr('transform', 'translate(' + barChartMargin.left + ',' + barChartMargin.top + ')');
}

function updateBarCharts(selectedMunicipalities) {
    var barChartSvg = d3.select('#charts-container').select("svg");

    barChartSvg.selectAll('.bar').remove();
    barChartSvg.selectAll('.label').remove();

    var bars = barChartSvg.selectAll('.bar')
        .data(selectedMunicipalities, function(d) { return d; })

    bars
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', 80)
        .attr('y', function(d, i) { return i * 20; })
        .attr('width', function(d) { return municipalityCodeToDataMap.get(d) * 10 })
        .attr('height', 15)
        .style('fill', 'steelblue');

    bars.exit().remove();

    var labels = barChartSvg.selectAll('.label')
        .data(selectedMunicipalities, function(d) { return d; });

    labels.enter()
        .append('text')
        .attr('class', 'label')
        .attr('x', 0)
        .attr('y', function(d, i) { return i * 20 + 12; })
        //.style('text-anchor', 'end')
        .text(function(d) { return municipalityCodeToNameMap.get(d); });

    labels.exit().remove();
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
      .style("font-size", "20px")
      .style("border", "2px solid #ccc");
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
    const alreadySelected = selectedMunicipalities.has(municipalityCode);
    if(alreadySelected) {
        removeSelectedMunicipality(event, d);
    } else {
        addSelectedMunicipality(event, d);
    }
    updateBarCharts(selectedMunicipalities);
    //event.stopPropagation();
}

function addSelectedMunicipality(event, d) {
    const municipalityCode = d.properties.code;
    const municipalityName = d.properties.name;

    const selectedMunicipalitiesDiv = document.getElementById('selected-municipalities-container');
    const nameElement = document.createElement("p")
    nameElement.id = municipalityCode + "SelectedText";
    nameElement.innerHTML = municipalityName + " (" + municipalityCodeToDataMap.get(municipalityCode) + ")";
    selectedMunicipalitiesDiv.appendChild(nameElement);
    selectedMunicipalities.add(municipalityCode);

    const clickedPath = d3.select(event.currentTarget);
    clickedPath.classed('highlighted', true);
}

function removeSelectedMunicipality(event, d) {
    const municipalityCode = d.properties.code;

    const selectedMunicipalitiesDiv = document.getElementById('selected-municipalities-container');
    const nameElement = document.getElementById(municipalityCode + "SelectedText");
    nameElement.remove();
    selectedMunicipalities.delete(municipalityCode);

    const clickedPath = d3.select(event.currentTarget);
    clickedPath.classed('highlighted', false);
}

initMap();
initBarCharts();