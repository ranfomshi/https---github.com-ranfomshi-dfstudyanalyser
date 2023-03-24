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
    appendSummaryData(studyArray);

    aoiAnalysis(studyArray);

}

function aoiAnalysis(studyArray) {
    studyArray.forEach((study, studyIndex) => {
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
                            label: shape.label,
                            pop: shape.pop,
                            las: shape.las,
                            soa: shape.soa,
                            pow: shape.pow
                        });
                    });
                }
            } catch {
                console.log("no shape data for this stage or in the wrong format", stage);
            }
        });
    });
    createAoiLableFrequencyChart(aoiData);
    displayAvgAoiPerStage(aoiData);
    displayBenchmarkAverages(aoiData);
}


function displayBenchmarkAverages(aoiData) {

    // format data for chart
    const chartData = transformAoiData(aoiData)
    console.log("chart data", chartData)

    // create chart
    var bmContainer = document.createElement('div')
    bmContainer.id = 'benchmarksChartContainer'
    bmContainer.className = 'chartCard'
    bmContainer.style.maxHeight = 'fit-content'
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
            },
            bar: {

                borderWidth: 0,
                columnWidth: '100%',

                dataLabels: {
                    position: 'top',
                }
            }
        },
        dataLabels: {

            style: {
                colors: ['#000', '#556677', '#32a852', '#3a87c2', '#c23ab9'],
            },

        },
        chart: {
            stacked: stack,
            stackType: 'normal',
            type: 'line',
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


function transformAoiData(aoiData) {
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
        const label = (data.label || 'No Label').toLowerCase();
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
                const dataLabel = (data.label || 'No Label').toLowerCase();
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
            show: true,
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
            show: true,
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
            show: true,
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

function createAoiLableFrequencyChart(aoiData) {
    theCanvas = document.createElement("div");
    theCanvas.className = "chartCard";
    theCanvas.id = "AoiLableFrequencyChart";
    document.getElementById("output").appendChild(theCanvas);

    // Step 1: Create an array of labels, converted to lowercase
    let labels = aoiData.map((item) => item.label ? item.label.toLowerCase() : "unlabeled");

    // Step 2: Create an object that stores the count of each label
    let labelCounts = labels.reduce((counts, label) => {
        counts[label] = (counts[label] || 0) + 1;
        return counts;
    }, {});

    // Step 3: Convert the object to an array of objects, filtering out "unlabeled" items
    let data = Object.keys(labelCounts)
        .filter((label) => label !== "unlabeled")
        .map((label) => {
            return {
                label: label,
                count: labelCounts[label],
            };
        });

    // Step 4: Sort the array of objects by count, in descending order
    data.sort((a, b) => b.count - a.count);

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
            data: data.map((item) => item.count),
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
            show: true,
            width: 2,
        },
        xaxis: {
            categories: data.map((item) => item.label),
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

function displayAvgAoiPerStage(aoiData) {
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
            show: true,
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
