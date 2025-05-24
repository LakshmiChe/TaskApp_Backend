const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const generateBarChart = async (data) => {
    const width = 800; // px
    const height = 400; // px
    const chartCallback = (ChartJS) => { /* Global config can go here */ };
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, chartCallback });

    const configuration = {
        type: 'bar',
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: 'Tasks by Category',
                data: Object.values(data),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
            }],
        },
    };

    return await chartJSNodeCanvas.renderToBuffer(configuration);
};

module.exports = { generateBarChart };
