const state = {
    data: [],
    country: "",
    selectedSex: null
    //selectedSurvived: null
};



function createHistogram(svgSelector) {
    const margin = {
        top: 40,
        bottom: 10,
        left: 120,
        right: 20
    };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Creates sources <svg> element
    const svg = d3.select(svgSelector)
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

    // Group used to enforce margin
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);


    // Scales setup
    const xscale = d3.scaleLinear().range([0, width]);
    const yscale = d3.scaleLinear().range([0, height]);

    // Axis setup
    const xaxis = d3.axisTop().scale(xscale);
    const g_xaxis = g.append('g').attr('class', 'x axis');
    const yaxis = d3.axisLeft().scale(yscale);
    const g_yaxis = g.append('g').attr('class', 'y axis');


    function update(new_data) { 
        //update the scales
        xscale.domain([0, d3.max(new_data, (d) => d.length)]);
        yscale.domain([new_data[0].x0, new_data[new_data.length - 1].x1]);
        //render the axis
        g_xaxis.transition().call(xaxis);
        g_yaxis.transition().call(yaxis);


        // Render the chart with new data

        // DATA JOIN
        const rect = g.selectAll('rect').data(new_data);

        // ENTER
        // new elements
        const rect_enter = rect.enter().append('rect')
            .attr('x', 0) //set intelligent default values for animation
            .attr('y', 0)
            .attr('width', 0)
            .attr('height', 0);
        rect_enter.append('title');

        // ENTER + UPDATE
        // both old and new elements
        rect.merge(rect_enter).transition()
            .attr('height', (d) => yscale(d.x1) - yscale(d.x0) - 2)
            .attr('width', (d) => xscale(d.length))
            .attr('y', (d) => yscale(d.x0) + 1);

        rect.merge(rect_enter).select('title').text((d) => `${d.x0}: ${d.length}`);

        // EXIT
        // elements that aren't associated with data
        rect.exit().remove();
    }

    return update;
}

function createPieChart(svgSelector, stateAttr, colorScheme) {
    const margin = 10;
    const radius = 100;

    // Creates sources <svg> element
    const svg = d3.select(svgSelector)
        .attr('width', radius * 2 + margin * 2)
        .attr('height', radius * 2 + margin * 2);

    // Group used to enforce margin
    const g = svg.append('g')
        .attr('transform', `translate(${radius + margin},${radius + margin})`);

    const pie = d3.pie().value((d) => d.values.length).sortValues(null).sort(null);
    const arc = d3.arc().outerRadius(radius).innerRadius(0);
    const noSlice = [
        { startAngle: 0, endAngle: Math.PI * 2, padAngle: 0 },
        { startAngle: 0, endAngle: 0, padAngle: 0 }
    ];

    const cscale = d3.scaleOrdinal(colorScheme);

    function update(new_data) { 
        const pied = pie(new_data);
        // Render the chart with new data

        cscale.domain(new_data.map((d) => d.key));

        // DATA JOIN
        const old = g.selectAll('path').data();
        const path = g.selectAll('path').data(pied, (d) => d.data.key);

        // ENTER
        // new elements
        const path_enter = path.enter().append('path');
        path_enter
            .attr('d', (d, i) => arc(noSlice[i]))
            .on('click', (d) => {
                if (state[stateAttr] === d.data.key) {
                    state[stateAttr] = null;
                } else {
                    state[stateAttr] = d.data.key;
                }
                updateApp();
            });
        path_enter.append('title');

        function tweenArc(d, i) {
            const interpolate = d3.interpolateObject(old[i], d);
            return (t) => arc(interpolate(t));
        }

        // ENTER + UPDATE
        // both old and new elements
        path.merge(path_enter)
            .classed('selected', (d) => d.data.key === state[stateAttr])
            .transition()
            .attrTween('d', tweenArc)
            .style('fill', (d) => cscale(d.data.key));

        path.merge(path_enter).select('title').text((d) => `${d.data.key}: ${d.data.values.length}`);

        // EXIT
        // elements that aren't associated with data
        path.exit()
            .transition()
            .attrTween('d', tweenArc)
            .remove();
    }

    return update;
}


const suicidesHistogram = createHistogram('#suicides');
const sexPieChart = createPieChart('#sex', 'selectedSex', d3.schemeSet3);
const popnHistogram = createHistogram('#population');
function filterData() {
  return state.data.filter((d) => {
    if (state.country && d.uid !== state.country) {
      return false;
    }
    if (state.selectedSex && d.sex !== state.selectedSex) {
      return false;
    }
    return true;
  });
}

function wrangleData(filtered) {
  const suicidesHistogram = d3.histogram()
  .domain([0, 10000])
  .thresholds(18)
  .value((d) => d.suicides);

  const suicidesHistogramData = suicidesHistogram(filtered);

  // always the two categories
  const sexPieData = ['female', 'male'].map((key) => ({
    key,
    values: filtered.filter((d) => d.sex === key)
  }));

  const popnHistogram = d3.histogram()
  .domain([0, d3.max(filtered, (d) => d.population)])
  .value((d) => d.population);

  const popnHistogramData = popnHistogram(filtered);
  return {suicidesHistogramData, sexPieData, popnHistogramData};
}

function updateApp() {
  const filtered = filterData();

  const {suicidesHistogramData, sexPieData, popnHistogramData} = wrangleData(filtered);
  suicidesHistogram(suicidesHistogramData);
  sexPieChart(sexPieData);
  popnHistogram(popnHistogramData);
  d3.select('#selectedSex').text(state.selectedSex || 'None');
}

d3.csv('https://vizhub.com/wishcsdev/datasets/data.csv').then((parsed) => {
    state.data = parsed.map((row) => {
        row.year = parseFloat(row.year);
        row.suicides = parseInt(row.suicides);
        row.population = parseInt(row.population);
        return row;
    });

    updateApp();
});

//interactivity
d3.select('#countrycl').on('change', function () {
  const selected = d3.select(this).property('value');
  state.country = selected;
  updateApp();
});