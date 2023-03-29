function start(array) {
    document.getElementById("startBtn").style.display = "none";
    document.getElementById("jsonInput").style.display = "none";
    document.getElementById("backBtn").style.display = "block";
    document.getElementById("instruction").style.display = "none";
    //clear previous output charts etc
    document.getElementById("output").innerHTML = "";
    document.getElementById("summaryData").innerText = "";
    //clear data ready for fresh input
    masterCollation = {
        numberOfReports: [],
        numberOfActiveVersions: [],
        NumberOfVisibleVersions: [],
        activeReportType: [],
    };
    aoiData = [];

    //tidy the json input
    var studyArrayString = wrapUrlsInDoubleQuotes("[" + array + "]");
    //check for empty studies and remove - this handles up to three in a row either at the start, somewhere in the middle, or at the end
    var counter = 0
    studyArrayString = studyArrayString.replace(/(?:\r\n|\r|\n)/g, '')
    studyArrayString = studyArrayString.replace("}[]{", () => { counter++; return ("}{") })
    studyArrayString = studyArrayString.replace("}[][]{", () => { counter++; return ("}{") })
    studyArrayString = studyArrayString.replace("}[][][]{", () => { counter++; return ("}{") })
    studyArrayString = studyArrayString.replace("[]{", () => { counter++; return ("{") })
    studyArrayString = studyArrayString.replace("[][]{", () => { counter++; return ("{") })
    studyArrayString = studyArrayString.replace("[][][]{", () => { counter++; return ("{") })
    studyArrayString = studyArrayString.replace("}[]", () => { counter++; return ("}") })
    studyArrayString = studyArrayString.replace("}[][]", () => { counter++; return ("}") })
    studyArrayString = studyArrayString.replace("}[][]", () => { counter++; return ("}") })
    console.log("replacements (studies without data) = " + counter)
    var studyArray = JSON.parse(addCommasToJsonString(studyArrayString));
    //display in console for user validation
    console.log("json vesrion", studyArray);
    //if no studies, alert and reset
    if (studyArray.length == 0) {
        alert('no populated studies found');
        window.location.reload()
    }
    //iterate on each study to produce any per study analysis and to start aggregation data
    //into another array called masterCollation
    try { perStudyAnalysis(studyArray) }
    catch { alert('Data in wrong format'); return }

    //use masterCollation to produce some charts
    //overallAnalysis(studyArray);
    try { overallAnalysis(studyArray); }
    catch { alert('Data in wrong format'); }
}

var masterCollation = {
    numberOfReports: [],
    numberOfActiveVersions: [],
    NumberOfVisibleVersions: [],
    activeReportType: [],
};
var aoiData = [];

function averageNumberOfHotspots(studyArray) {
    const numberOfHotspots = [];

    // Iterate through each study
    for (let i = 0; i < studyArray.length; i++) {
        const study = studyArray[i];

        // Iterate through each stage in the study
        for (let j = 0; j < study.stages.length; j++) {
            const stage = study.stages[j];

            // Check if the stage has a hotspots object
            if (stage.hotspots) {
                // Check if the hotspots object has a center object with a hotspots array
                if (stage.hotspots.center && stage.hotspots.center.hotspots) {
                    numberOfHotspots.push(stage.hotspots.center.hotspots.length);
                } else if (stage.hotspots.none && stage.hotspots.none.hotspots) {
                    // Only add to the array if the center object is not available
                    numberOfHotspots.push(stage.hotspots.none.hotspots.length);
                }
            }
        }
    }
    const sum = numberOfHotspots.reduce((acc, val) => acc + val);
    const average = sum / numberOfHotspots.length;

    var avgHotspots = document.createElement("div");
    avgHotspots.innerHTML =
        "<p class='cardText'>Average number of hotspots per HS report: </p><b class='cardMetric'> " +
        average.toFixed(2) +
        "</b>"
    avgHotspots.className = "card";
    document.getElementById("summaryData").appendChild(avgHotspots);

}

function hotspotsAverageDigestibvility(studyArray) {
    digestibilityArray = []

    // Iterate through each study
    for (let i = 0; i < studyArray.length; i++) {
        const study = studyArray[i];

        // Iterate through each stage in the study
        for (let j = 0; j < study.stages.length; j++) {
            const stage = study.stages[j];

            // Check if the stage has a hotspots object
            if (stage.hotspots) {
                // Check if the hotspots object has a center object with a hotspots array
                if (stage.hotspots.center && stage.hotspots.center.hotspots) {
                    digestibilityArray.push(stage.hotspots.center.digestibilityScore)
                } else if (stage.hotspots.none && stage.hotspots.none.hotspots) {
                    // Only add to the array if the center object is not available
                    digestibilityArray.push(stage.hotspots.none.digestibilityScore)
                }
            }
        }
    }

    const sum = digestibilityArray.reduce((acc, val) => acc + val);
    const average = sum / digestibilityArray.length;

    var avgDigestibility = document.createElement("div");
    avgDigestibility.innerHTML =
        "<p class='cardText'>Average digestibility: </p><b class='cardMetric'> " +
        average.toFixed(2) +
        "</b>"
    avgDigestibility.className = "card";
    document.getElementById("summaryData").appendChild(avgDigestibility);

}

function perStudyAnalysis(array) {
    array.forEach((study, Index) => {

        var numberOfReports = study.reports.length;
        masterCollation.numberOfReports.push({
            index: Index,
            number: numberOfReports,
        });

        var numberOfActiveVersions = study.stages.length;
        masterCollation.numberOfActiveVersions.push({
            index: Index,
            number: numberOfActiveVersions,
        });

        var NumberOfVisibleVersions = study.workspace.layout.columns;
        masterCollation.NumberOfVisibleVersions.push({
            index: Index,
            number: NumberOfVisibleVersions,
        });

        var activeReportID = study.workspace.activeReport;
        var activeReportType = study.reports.find(
            (report) => report.id == activeReportID
        );

        masterCollation.activeReportType.push({
            index: Index,
            type: activeReportType.type,
        });
    });
}

function overallAnalysis(studyArray) {
    console.log(masterCollation);
    createNumberofReportsChart(
        masterCollation.numberOfReports.sort((a, b) => a.number - b.number)
    );
    createNumberofVisibleVersionsChart(
        masterCollation.NumberOfVisibleVersions.sort((a, b) => a.number - b.number)
    );
    createNumberofActiveVersionsChart(
        masterCollation.numberOfActiveVersions.sort((a, b) => a.number - b.number)
    );

    displayReportSummary(studyArray);
    displayMetricSummary(studyArray);
    appendSummaryData(studyArray);
    displayActiveReportTypes(studyArray);
    aoiAnalysis(studyArray);
    averageNumberOfHotspots(studyArray);
    hotspotsAverageDigestibvility(studyArray)
}

function aoiAnalysis(studyArray) {
    //within each study
    studyArray.forEach((study, studyIndex) => {
        //within each stage
        study.stages.forEach((stage, stageIndex) => {
            try {
                if (stage.aoi[0].shapes.length > 0) {
                    stage.aoi[0].shapes.forEach((shape, shapeIndex) => {
                        shape.studyIndex = studyIndex;
                        shape.stageIndex = stageIndex;
                        shape.shapeIndex = shapeIndex;

                        aoiData.push({
                            study: studyIndex,
                            stage: stageIndex,
                            shape: shapeIndex,
                            label: shape.label.trim(),
                            pop: shape.pop,
                            las: shape.las,
                            soa: shape.soa,
                            pow: shape.pow,
                            type: shape.type
                        });

                    });
                }
            } catch {
                // console.log("no shape data for this stage or in the wrong format", stage);
            }
        });
    });
    createAoiLableFrequencyChart();
    displayAvgAoiPerStage();
    displayBenchmarkAverages();
    displayShapeBreakdown()
    metricVsMetric()
}

function displayShapeBreakdown() {
    var poly = 0
    var rect = 0

    // count the labels and sum the scores
    for (const data of aoiData) {
        if (data.type == "rectangle") { rect++ }
        if (data.type == "polygon") { poly++ }
    }

    var shapeBreakdown = document.createElement("div");
    shapeBreakdown.innerHTML =
        "<p class='cardText'>Polygon v Rectangle: </p><b class='cardMetric'> " +
        poly.toString() + " v " + rect.toString()
    "</b>";
    shapeBreakdown.className = "card";
    document.getElementById("summaryData").appendChild(shapeBreakdown);
}

function displayBenchmarkAverages() {

    // format data for chart
    const chartData = transformAoiData(aoiData)
    //console.log("chart data", chartData)

    // create chart
    var bmContainer = document.createElement('div')
    bmContainer.id = 'benchmarksChartContainer'
    bmContainer.className = 'chartCard h550'

    bmContainer.style.minHeight = '400px !important'
    bmContainer.style.padding = 0
    bmContainer.style.width = "100%"
    document.getElementById('output').appendChild(bmContainer)

    bm = document.createElement('div')
    bm.id = 'benchmarksChart'
    document.getElementById('benchmarksChartContainer').appendChild(bm)

    //create check box for stacking

    var stack = true
    var cb = document.createElement('input')
    cb.type = 'checkbox'
    cb.id = 'cb'
    cb.checked = true

    cb.onclick = () => {
        stack = !stack
        console.log(stack)
        chart.updateOptions({
            chart: {
                height: 350,
                stacked: stack,
                stackType: 'normal',
                type: 'bar',
            },
        })
    }
    cbLabel = document.createElement('label')
    cbLabel.innerText = "stacked bar"
    cbLabel.setAttribute('for', 'cb')
    bmContainer.appendChild(cb)
    bmContainer.appendChild(cbLabel)
    bmContainer.style.minWidth = '50%'

    const chart = new ApexCharts(document.getElementById('benchmarksChart'), {
        plotOptions: {
            yaxis: {
                show: false
            }
        },
        events: {
            mounted: (chart) => {
                chart.windowResizeHandler();
            }
        },
        stroke: {
            colors: ['transparent', 'transparent', 'transparent', 'transparent', '#C817E6'],
            curve: 'smooth'
        },
        chart: {
            height: 500,
            stacked: stack,
            stackType: 'normal',
            type: 'line'
        },
        series: chartData.series,
        xaxis: {
            categories: chartData.labels,
            max: 10
        },
        yaxis: [
            {
                show: true,
                title: {
                    text: 'Metrics'
                },
            },
        ]
    });
    chart.render();

}

function transformAoiData() {
    console.log("aoi data", aoiData)
    // aoiData.forEach(item => {
    //     if (item.label) {
    //         if (item["label"].toLowerCase() == 'imagery') {
    //             console.log(item)
    //         }
    //     }

    // })
    const scores = ["pop", "las", "soa", "pow"];
    const labelCounts = {};
    const labelScores = {};

    // count the labels and sum the scores
    for (const data of aoiData) {
        if (!data.label) {
            continue; // skip items without a label
        }
        const label = data.label.toLowerCase();
        const scoreKeys = Object.keys(data).filter((key) => scores.includes(key));
        if (!labelCounts[label]) {
            labelCounts[label] = 0;
            labelScores[label] = {};
            for (const score of scores) {
                labelScores[label][score] = 0;
            }
        }
        labelCounts[label]++;
        for (const key of scoreKeys) {
            labelScores[label][key] += parseFloat(data[key]);
        }
    }

    // calculate the averages
    const labelAverages = {};
    for (const label of Object.keys(labelCounts)) {
        labelAverages[label] = {};
        for (const score of scores) {
            const values = [];
            for (const data of aoiData) {
                if (!data.label) {
                    continue; // skip items without a label
                }
                const dataLabel = data.label.toLowerCase();
                if (dataLabel === label) {
                    const value = parseFloat(data[score]);
                    if (!isNaN(value)) {
                        values.push(value);
                    }
                }
            }
            if (values.length > 0) {
                const sum = values.reduce((a, b) => a + b, 0);
                const average = sum / values.length;
                labelAverages[label][score] = parseFloat(average.toFixed(3));
            } else {
                labelAverages[label][score] = 0;
            }
        }
    }

    // create the output format
    const distinctLabels = Object.keys(labelCounts).sort(
        (a, b) => labelCounts[b] - labelCounts[a]
    );
    const series = [];
    for (const score of scores) {
        const data = [];
        for (const label of distinctLabels) {
            data.push(labelAverages[label][score]);
        }
        series.push({
            name: score.toUpperCase(),
            data: data,
            type: "column"
        });
    }
    const countData = [];
    for (const label of distinctLabels) {
        countData.push(labelCounts[label]);
    }
    series.push({
        name: "Count",
        data: countData,
        type: "line"
    });
    return {
        series: series,
        labels: distinctLabels
    };
}

function metricVsMetric() {
    theCanvas = document.createElement("div");
    theCanvas.className = "chartCard";
    theCanvas.id = "soaVsPow";
    document.getElementById("output").appendChild(theCanvas);

    // Filter out objects without defined soa and pow scores
    const filteredData = aoiData
        .filter(obj => obj.soa !== undefined && obj.soa !== null && obj.pow !== undefined && obj.pow !== null && obj.pop !== undefined && obj.pop !== null);

    // Create an apexchart scatter plot
    var options = {
        title: {
            text: 'Metric vs Metric',
            align: 'left',
            margin: 10,
            offsetX: 0,
            offsetY: 0,
            floating: false,
            style: {
                fontSize: '13px',
                fontWeight: '100',
                fontFamily: 'inter',
                color: '#a9a9a9'
            },
        },
        chart: {
            type: 'scatter',
            height: 300,
            zoom: {
                enabled: true,
                type: 'xy'
            }
        },
        series: [{
            name: "POW/SOA",
            data: filteredData.map(obj => ({ x: obj.pow, y: obj.soa }))
        }, {
            name: "POW/POP",
            data: filteredData.map(obj => ({ x: obj.pow, y: obj.pop }))
        },
        {
            name: "POP/SOA",
            data: filteredData.map(obj => ({ x: obj.pop, y: obj.soa }))
        }
        ],
        xaxis: {
            title: {
                show: false
            },
            labels: {
                formatter: function (value) {
                    return value.toFixed(1).replace(/\.?0+$/, '');
                }
            },
            tickAmount: 10
        },
        yaxis: {
            labels: {
                formatter: function (value) {
                    return value.toFixed(1).replace(/\.?0+$/, '');
                }
            },
            title: {
                show: false
            }
        }

    }
    var chart = new ApexCharts(document.getElementById("soaVsPow"), options);
    chart.render()
}

function wrapUrlsInDoubleQuotes(str) {
    if (typeof str !== "string") {
        throw new TypeError("wrapUrlsInDoubleQuotes expects a string");
    }

    return str.replace(/(https?:\/\/(?!")[^\s,]+)(?<!")(\s*,)/g, '"$1"$2');
}

function addCommasToJsonString(jsonString) {
    var newString = jsonString.replace(/}\s*{/g, "},{"); // add commas between objects
    return newString;
}

function createNumberofReportsChart(data) {
    theCanvas = document.createElement("div");
    theCanvas.className = "chartCard";
    theCanvas.id = "reportsFrequencyChart";
    document.getElementById("output").appendChild(theCanvas);

    let numbers = data.map((item) => item.number); // get all the numbers
    let uniqueNumbers = [...new Set(numbers)]; // get all the unique numbers
    let frequency = uniqueNumbers.map(
        (num) => numbers.filter((n) => n === num).length
    ); // get the frequency of each unique number


    var options = {
        title: {
            text: theCanvas.id,
            align: 'left',
            margin: 10,
            offsetX: 0,
            offsetY: 0,
            floating: false,
            style: {
                fontSize: '13px',
                fontWeight: '100',
                fontFamily: 'inter',
                color: '#a9a9a9'
            },
        },
        events: {
            mounted: (chart) => {
                chart.windowResizeHandler();
            }
        },
        series: [{
            name: 'Reports frequency',
            data: frequency,
            type: 'bar'
        }],
        chart: {
            height: 280,
            width: "100%",
            type: 'line',
            zoom: { enabled: true }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                endingShape: 'rounded'
            },
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            show: false,
            width: 2,
        },
        xaxis: {
            categories: uniqueNumbers
        },
        yaxis: {

        },
        fill: {
            opacity: 1
        },
        tooltip: {
            y: {
            }
        }
    };

    var chart = new ApexCharts(document.getElementById("reportsFrequencyChart"), options);
    chart.render();
}

function createNumberofVisibleVersionsChart(data) {
    theCanvas = document.createElement("div");
    theCanvas.className = "chartCard";
    theCanvas.id = "visibleVersionsFrequencyChart";
    document.getElementById("output").appendChild(theCanvas);

    let numbers = data.map((item) => item.number); // get all the numbers
    let uniqueNumbers = [...new Set(numbers)]; // get all the unique numbers
    let frequency = uniqueNumbers.map(
        (num) => numbers.filter((n) => n === num).length
    ); // get the frequency of each unique number

    var options = {
        title: {
            text: theCanvas.id,
            align: 'left',
            margin: 10,
            offsetX: 0,
            offsetY: 0,
            floating: false,
            style: {
                fontSize: '13px',
                fontWeight: '100',
                fontFamily: 'inter',
                color: '#a9a9a9'
            },
        },
        events: {
            mounted: (chart) => {
                chart.windowResizeHandler();
            }
        },
        series: [{
            name: 'Visible versions frequency frequency',
            data: frequency,
            type: 'bar'
        }],
        chart: {
            height: 280,
            width: "100%",
            type: 'line',
            zoom: { enabled: true }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                endingShape: 'rounded'
            },
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            show: false,
            width: 2,
        },
        xaxis: {
            categories: uniqueNumbers,
        },
        yaxis: {

        },
        fill: {
            opacity: 1
        },
        tooltip: {
            y: {
            }
        }
    };

    var chart = new ApexCharts(document.getElementById("visibleVersionsFrequencyChart"), options);
    chart.render();
}

function createNumberofActiveVersionsChart(data) {
    theCanvas = document.createElement("div");
    theCanvas.className = "chartCard";
    theCanvas.id = "activeVersionsFrequencyChart";
    document.getElementById("output").appendChild(theCanvas);

    let numbers = data.map((item) => item.number); // get all the numbers
    let uniqueNumbers = [...new Set(numbers)]; // get all the unique numbers
    let frequency = uniqueNumbers.map(
        (num) => numbers.filter((n) => n === num).length
    ); // get the frequency of each unique number

    var options = {
        chart: {
            height: 280,
            width: "100%",
            type: 'line',
            zoom: { enabled: true }
        },
        title: {
            text: theCanvas.id,
            align: 'left',
            margin: 10,
            offsetX: 0,
            offsetY: 0,
            floating: false,
            style: {
                fontSize: '13px',
                fontWeight: '100',
                fontFamily: 'inter',
                color: '#a9a9a9'
            },
        },
        events: {
            mounted: (chart) => {
                chart.windowResizeHandler();
            }
        },
        series: [{
            name: 'Active versions frequency',
            data: frequency,
            type: 'bar',
            fill: {
                type: "gradient",
                gradient: {
                    shadeIntensity: 0.5,
                    opacityFrom: 0.7,
                    opacityTo: 0.9,
                    gradientToColors: ['#b20000', '#ff0000', '#ff5f5f'],
                    stops: [0, 50, 100]
                }
            }

        }],
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                endingShape: 'rounded'
            },
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            show: false,
            width: 2,
        },
        xaxis: {
            categories: uniqueNumbers,
        },
        yaxis: {

        },
        fill: {
            opacity: 1
        },
        tooltip: {
            y: {
            }
        }
    };

    var chart = new ApexCharts(document.getElementById("activeVersionsFrequencyChart"), options);
    chart.render();
}

function createAoiLableFrequencyChart() {
    theCanvas = document.createElement("div");
    theCanvas.className = "chartCard";
    theCanvas.id = "AoiLableFrequencyChart";
    document.getElementById("output").appendChild(theCanvas);

    // Initialize an empty object to store the label counts
    let labelCounts = {};

    // Loop through the aoiData array and count the occurrences of each unique label
    aoiData.forEach(obj => {
        let label = obj.label.toLowerCase();
        if (labelCounts[label]) {
            labelCounts[label]++;
        } else {
            labelCounts[label] = 1;
        }
    });

    // Sort the keys of the labelCounts object based on their corresponding values
    let sortedLabels = Object.keys(labelCounts).sort((a, b) => {
        return labelCounts[b] - labelCounts[a];
    });

    // Create a new object with the sorted labels and their counts
    let labelCountsObject = {};
    sortedLabels.forEach(label => {
        labelCountsObject[label] = labelCounts[label];
    });

    // Step 5: Use the data to create a chart using lib
    var options = {
        title: {
            text: theCanvas.id,
            align: 'left',
            margin: 10,
            offsetX: 0,
            offsetY: 0,
            floating: false,
            style: {
                fontSize: '13px',
                fontWeight: '100',
                fontFamily: 'inter',
                color: '#a9a9a9'
            },
        },
        events: {
            mounted: (chart) => {
                chart.windowResizeHandler();
            }
        },
        series: [{
            name: 'AOI label frequency',
            data: Object.values(labelCountsObject),
            type: 'bar'
        }],
        chart: {
            height: 280,
            width: "100%",
            type: 'line',
            zoom: { enabled: true }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                endingShape: 'rounded'
            },
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            show: false,
            width: 2,
        },
        xaxis: {
            categories: Object.keys(labelCountsObject),
            max: 20
        },
        yaxis: {

        },
        fill: {
            opacity: 1
        },
        tooltip: {
            y: {
            }
        }
    };

    var chart = new ApexCharts(document.getElementById("AoiLableFrequencyChart"), options);
    chart.render();
}

function displayAvgAoiPerStage() {
    // Step 1: Create an object that stores the count of aoi for each stage and study
    const countsByStageAndStudy = aoiData.reduce((counts, item) => {
        const key = `${item.study}:${item.stage}`;
        counts[key] = (counts[key] || 0) + 1;
        return counts;
    }, {});

    // Step 2: Create an array of the counts
    const counts = Object.values(countsByStageAndStudy);

    // Step 3: Calculate the sum of the counts
    const sum = counts.reduce((total, count) => total + count, 0);

    // Step 4: Calculate the average
    const average = (sum / Object.keys(countsByStageAndStudy).length).toFixed(2);

    var avgAOIElem = document.createElement("div");
    avgAOIElem.innerHTML =
        "<p class='cardText'>Average AOI per version: </p><b class='cardMetric'> " +
        average +
        "</b>";
    avgAOIElem.className = "card";
    document.getElementById("summaryData").appendChild(avgAOIElem);
}

function displayReportSummary(studyArray) {
    let reportTypes = {}; // initialize an empty object to store the totals for each type

    for (let i = 0; i < studyArray.length; i++) {
        let reports = studyArray[i].reports;
        for (let j = 0; j < reports.length; j++) {
            let reportType = reports[j].type;
            if (reportTypes[reportType]) {
                reportTypes[reportType] += 1; // increment the count for this type if it already exists in the object
            } else {
                reportTypes[reportType] = 1; // add this type to the object and set the count to 1 if it doesn't already exist
            }
        }
    }

    theCanvas = document.createElement("div");
    theCanvas.className = "chartCard";
    theCanvas.id = "reportsSummary";
    document.getElementById("output").appendChild(theCanvas);

    let labels = Object.keys(reportTypes);
    let data = Object.values(reportTypes);

    var options = {
        title: {
            text: theCanvas.id,
            align: 'left',
            margin: 10,
            offsetX: 0,
            offsetY: 0,
            floating: false,
            style: {
                fontSize: '13px',
                fontWeight: '100',
                fontFamily: 'inter',
                color: '#a9a9a9'
            },
        },
        events: {
            mounted: (chart) => {
                chart.windowResizeHandler();
            }
        },
        series: [{
            name: 'Frequency',
            data: data,
            type: 'bar'
        }],
        chart: {
            height: 280,
            width: "100%",
            type: 'line',
            zoom: { enabled: true }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                endingShape: 'rounded'
            },
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            show: false,
            width: 2,
        },
        xaxis: {
            categories: labels
        },
        yaxis: {

        },
        fill: {
            opacity: 1
        },
        tooltip: {
            y: {
            }
        }
    };

    var chart = new ApexCharts(document.getElementById("reportsSummary"), options);
    chart.render();
}
function displayMetricSummary(studyArray) {
    let metricTypes = {}; // initialize an empty object to store the totals for each type

    for (let i = 0; i < studyArray.length; i++) {
        let reports = studyArray[i].reports;
        for (let j = 0; j < reports.length; j++) {
            let settings = reports[j].settings;
            if (settings && settings.metric) {
                let metric = settings.metric;
                if (metricTypes[metric]) {
                    metricTypes[metric] += 1; // increment the count for this type if it already exists in the object
                } else {
                    metricTypes[metric] = 1; // add this type to the object and set the count to 1 if it doesn't already exist
                }
            }
        }
    }

    theCanvas = document.createElement("div");
    theCanvas.className = "chartCard";
    theCanvas.id = "metricSummary";
    document.getElementById("output").appendChild(theCanvas);

    let labels = Object.keys(metricTypes);
    let data = Object.values(metricTypes);

    var options = {
        title: {
            text: theCanvas.id,
            align: 'left',
            margin: 10,
            offsetX: 0,
            offsetY: 0,
            floating: false,
            style: {
                fontSize: '13px',
                fontWeight: '100',
                fontFamily: 'inter',
                color: '#a9a9a9'
            },
        },
        events: {
            mounted: (chart) => {
                chart.windowResizeHandler();
            }
        },
        series: [{
            name: 'Frequency',
            data: data,
            type: 'bar'
        }],
        chart: {
            height: 280,
            width: "100%",
            type: 'line',
            zoom: { enabled: true }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                endingShape: 'rounded'
            },
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            show: false,
            width: 2,
        },
        xaxis: {
            categories: labels
        },
        yaxis: {

        },
        fill: {
            opacity: 1
        },
        tooltip: {
            y: {
            }
        }
    };

    var chart = new ApexCharts(document.getElementById("metricSummary"), options);
    chart.render();
}

function appendSummaryData(studyArray) {
    totalStudies(studyArray);
    totalReports(studyArray);
    reportsPerStudy(studyArray);
    averageVersionsPerStudy(studyArray);

    // apexExample()
}

function totalStudies(studyArray) {
    //total studies
    var noOfStudies = document.createElement("div");
    noOfStudies.className = "card";
    noOfStudies.innerHTML =
        "<p class='cardText'>Number of studies: </p><b class='cardMetric'> " +
        studyArray.length +
        "</p>";
    document.getElementById("summaryData").appendChild(noOfStudies);
}

function totalReports(studyArray) {
    //total reports
    var noOfReports = document.createElement("div");
    noOfReports.className = "card";
    let totalReports = 0;
    for (let i = 0; i < studyArray.length; i++) {
        totalReports += studyArray[i].reports.length;
    }
    noOfReports.innerHTML =
        "<p class='cardText'>Total number of reports: </p><b class='cardMetric'> " +
        totalReports +
        "</b>";
    document.getElementById("summaryData").appendChild(noOfReports);
}

function reportsPerStudy(studyArray) {
    //reports per study

    let totalReports = 0;
    for (let i = 0; i < studyArray.length; i++) {
        totalReports += studyArray[i].reports.length;
    }

    var avgReports = document.createElement("div");
    avgReports.className = "card";
    avgReports.innerHTML =
        "<p class='cardText'>Avg Reports per study: </p><b class='cardMetric'> " +
        (totalReports / studyArray.length).toFixed(2) +
        "</b>";
    document.getElementById("summaryData").appendChild(avgReports);
}

function averageVersionsPerStudy(studyArray) {
    //average versions per study
    var totalNoOfStages = 0;
    studyArray.forEach((study) => {
        totalNoOfStages = totalNoOfStages + study.stages.length;
    });
    var avgStagesPerStudy = (totalNoOfStages / studyArray.length).toFixed(2);
    var avgStudyElem = document.createElement("div");
    avgStudyElem.className = "card";
    avgStudyElem.innerHTML =
        "<p class='cardText'>Average versions per study: </p><b class='cardMetric'> " +
        avgStagesPerStudy +
        "</b>";
    document.getElementById("summaryData").appendChild(avgStudyElem);
}

function reset() {
    //clear previous output charts etc
    document.getElementById("output").innerHTML = "";
    document.getElementById("summaryData").innerText = "";
    //clear data ready for fresh input
    masterCollation = {
        numberOfReports: [],
        numberOfActiveVersions: [],
        NumberOfVisibleVersions: [],
        activeReportType: [],
    };
    aoiData = [];

    document.getElementById("startBtn").style.display = "block";
    document.getElementById("jsonInput").style.display = "block";
    document.getElementById("backBtn").style.display = "none";
    document.getElementById("instruction").style.display = "block";
}

window.addEventListener('scroll', function () {
    var button = document.getElementById('backBtn');
    if (window.scrollY > button.offsetTop) {
        button.classList.add('top');
    } else {
        button.classList.remove('top');
    }
});

function displayActiveReportTypes(studyArray) {
    theCanvas = document.createElement("div");
    theCanvas.className = "chartCard";
    theCanvas.id = "activeReportsFrequencyChart";
    document.getElementById("output").appendChild(theCanvas);

    let allActiveReports = []
    studyArray.forEach(study => {
        let activeReport = study.workspace.activeReport


        study.reports.forEach(report => {
            if (report.id == activeReport) {
                allActiveReports.push(report.type)
            }
        });
    })

    const summary = allActiveReports.reduce((acc, curr) => {
        if (!acc[curr]) {
            acc[curr] = 1;
        } else {
            acc[curr]++;
        }
        return acc;
    }, {});



    var options = {
        events: {
            mounted: (chart) => {
                chart.windowResizeHandler();
            }
        },
        series: Object.values(summary),
        labels: Object.keys(summary),
        title: {
            text: theCanvas.id,
            align: 'left',
            margin: 10,
            offsetX: 0,
            offsetY: 0,
            floating: false,
            style: {
                fontSize: '13px',
                fontWeight: '100',
                fontFamily: 'inter',
                color: '#a9a9a9'
            },
        },
        chart: {
            type: 'donut',
            height: 280
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '65%'
                }
            }
        },
        responsive: [{
            breakpoint: 480,
            options: {
                chart: {
                    width: 200
                },
                legend: {
                    position: 'bottom'
                }
            }
        }]
    };




    var chart = new ApexCharts(document.getElementById("activeReportsFrequencyChart"), options);
    chart.render();

}