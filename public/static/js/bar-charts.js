import { selectedMunicipalities, colorScale, getMunicipalityCodeToYearKey, currentYear } from './index.js'

const barChartMargin = { top: 20, right: 20, bottom: 20, left: 20 };
const barChartWidth = 700 - barChartMargin.left - barChartMargin.right;
const barChartHeight = 500 - barChartMargin.top - barChartMargin.bottom;

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

export function initBarCharts() {
    return d3.select('#charts-container')
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
        .attr('class', 'bar')
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
          .on('mouseout', function () {
              barChartTooltip.html('').style('visibility', 'hidden');
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