import { selectedMunicipalities, colorScale, getMunicipalityCodeToYearKey, currentYear } from './index.js'

const barChartMargin = { top: 20, right: 20, bottom: 20, left: 20 };
const barChartWidth = 700 - barChartMargin.left - barChartMargin.right;
const barChartHeight = 500 - barChartMargin.top - barChartMargin.bottom;

const sortUpHtml = "<svg id='sort-up-icon' xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='currentColor' class='bi bi-sort-up' viewBox='0 0 16 16'><path d='M3.5 12.5a.5.5 0 0 1-1 0V3.707L1.354 4.854a.5.5 0 1 1-.708-.708l2-1.999.007-.007a.498.498 0 0 1 .7.006l2 2a.5.5 0 1 1-.707.708L3.5 3.707V12.5zm3.5-9a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zM7.5 6a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zm0 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3zm0 3a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1z'/></svg>"
const sortDownHtml = "<svg id='sort-down-icon' xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='currentColor' class='bi bi-sort-down' viewBox='0 0 16 16'><path d='M3.5 2.5a.5.5 0 0 0-1 0v8.793l-1.146-1.147a.5.5 0 0 0-.708.708l2 1.999.007.007a.497.497 0 0 0 .7-.006l2-2a.5.5 0 0 0-.707-.708L3.5 11.293V2.5zm3.5 1a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zM7.5 6a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zm0 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3zm0 3a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1z'/></svg>"

const maxBarLabelWidth = 95;

const barChartXScale = d3.scaleLinear()
        .domain([0, 30])
        .range([0, barChartWidth]);

const barChartYScale = d3.scaleBand()
    .range([0, barChartHeight])
    .padding(0.1);

const barChartSvg = initBarCharts();

const barChartTooltip = initBarChartToolTip();

initBarChartXAxis();
initBarChartYAxis();
handleSort();

export function initBarCharts() {
    return d3.select('#bar-chart-container')
        .append('svg')
        .attr("width", barChartWidth + barChartMargin.left + barChartMargin.right)
        .attr("height", barChartHeight + barChartMargin.top + barChartMargin.bottom)
        .append("g")
        .attr("transform", "translate(" + barChartMargin.left + "," + barChartMargin.top + ")");
}

function initBarChartXAxis() {
    return barChartSvg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(" + maxBarLabelWidth + "," + barChartHeight + ")")
      .call(d3.axisBottom(barChartXScale))
      .selectAll("text")
          .attr("transform", "translate(4,0)")
          .style("font-size", "13px")
          .style("text-anchor", "end");
}

function initBarChartYAxis() {
    return barChartSvg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + maxBarLabelWidth + ",0)")
        .style("font-size", "17px")
        .call(d3.axisLeft(barChartYScale))
}

function initBarChartToolTip() {
    return d3.select('body')
        .append('div')
        .attr('class', 'hover-tooltip')
        .attr("id", "bar-chart-tooltip");
}

function handleSort() {
    const $sortButton = $("#sort-button");
    $sortButton.append(sortUpHtml)
    $sortButton.on("click", function() {
        let newSort;
        if($sortButton.find("svg").attr("id") == "sort-up-icon") {
            newSort = sortDownHtml;
        } else {
            newSort = sortUpHtml;
        }

        switchSortIcon($sortButton, newSort);
        selectedMunicipalities.sort((a,b) => {
            if(newSort == sortDownHtml) {
                return a.yearData[currentYear] - b.yearData[currentYear];
            } else {
                return b.yearData[currentYear] - a.yearData[currentYear];
            }
          }) 
        updateBarCharts();
    })
}

function switchSortIcon($sortButton, newSort) {
    $sortButton.find("svg").remove();
    $sortButton.append(newSort);
}

// Redraw entire bar charts when adding or removing selected municipalities
export function updateBarCharts() {
    barChartSvg.selectAll('.bar').remove();

    barChartYScale.domain(selectedMunicipalities.map(function(d) { return d.name; }));
    barChartSvg.select(".y.axis")
        .call(d3.axisLeft(barChartYScale))

    var bars = barChartSvg.selectAll('.bar')
        .data(selectedMunicipalities, function(d) { return d; })

    bars
        .enter()
        .append('rect')
        .classed('bar', true)
        .classed('municipality-bar', true)
        .attr('x', barChartXScale(0) + maxBarLabelWidth + 1)
        .attr('y', function(d) { return barChartYScale(d.name); })
        .attr("width", 0)
        .attr('height', barChartYScale.bandwidth())
        .style('fill', function(d) { return colorScale(d.yearData[currentYear]); })
        .on('mouseover', function (d, i) {
              barChartTooltip
                .html(
                  '<div>' + i.yearData[currentYear] + '</div>'
                )
                .style('visibility', 'visible');
          })
        .on('mousemove', function(event) {
            barChartTooltip
                .style('top', (event.pageY - 15) + 'px')
                .style('left', (event.pageX + 15) + 'px');
        })
        .on('mouseout', function() {
            barChartTooltip.html('').style('visibility', 'hidden');
        })
        .on('click', function(d, i) {
            d3.select("#municipality-" + i.code)
               .dispatch('click');
        })
        .transition()
        .duration(600)
        .attr('width', function(d) { return barChartXScale(d.yearData[currentYear]); })
}

export function clearBarCharts() {
    barChartSvg.selectAll('.bar')
        .transition()
        .duration(600)
        .attr("width", 0)
        .remove();

    barChartSvg
        .select('.y.axis')
        .selectAll('.tick')
        .transition()
        .duration(200)
        .delay(300)
        .attr("opacity", 0)
        .remove();
}

// Update bar charts when selected municipalities stay the same but year changes
export function updateBarChartsYear() {
    barChartSvg.selectAll('.bar')
        .transition()
        .duration(400)
        .style('fill', function(d) { return colorScale(d.yearData[currentYear]); })
        .attr('width', function(d) { return barChartXScale(d.yearData[currentYear]); });
}