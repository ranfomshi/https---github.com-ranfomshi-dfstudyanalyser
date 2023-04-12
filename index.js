var companyFilter = []
var masterCollation = {
    numberOfReports: [],
    numberOfActiveVersions: [],
    NumberOfVisibleVersions: [],
    activeReportType: [],
};
var aoiData = [];
var studyArray = [];

function start(array, start, end) {
    document.getElementById("startBtn").style.display = "none";
    document.getElementById("jsonInput").style.display = "none";
    document.getElementById("backBtn").style.display = "block";
    document.getElementById("instruction").style.display = "none";
    //clear previous output charts etc
    document.getElementById("output").innerHTML = "";
    document.getElementById("companiesFilter").innerHTML = "";
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
    var studyArray = tidyResults("[" + array + "]");

    displayCompanies(tidyResults("[" + document.getElementById("jsonInput").value + "]"))

    //create min and max var for filtering
    var { minDate, maxDate } = studyArray.reduce(
        (accumulator, current) => {
            const { CreatedAt } = current;
            return {
                minDate: CreatedAt < accumulator.minDate ? CreatedAt : accumulator.minDate,
                maxDate: CreatedAt > accumulator.maxDate ? CreatedAt : accumulator.maxDate,
            };
        },
        {
            minDate: studyArray[0].CreatedAt,
            maxDate: studyArray[0].CreatedAt,
        }
    );



    //apply the date filter - if none selected, use the min and max dates from the query result
    studyArray = studyArray.filter(study => {
        var createdAt = new Date(study.CreatedAt);
        if (!start || start == undefined) {
            start == minDate
        }
        if (!end || end == undefined) {
            end == maxDate
        }
        var startDate = new Date(start);
        var endDate = new Date(end);
        return createdAt >= startDate && createdAt <= endDate;
    });



    //display in console for user validation
    console.log("json vesrion", studyArray);
    //if no studies, alert and reset
    if (studyArray.length == 0) {
        alert('no populated studies found');
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

function displayCompanies(x) {
    var addedCompanies = {}; // use an object to keep track of added companies
    var companyList = []; // use an array to store the sorted companies and their counts

    // Iterate over studies to create a list of unique companies
    x.forEach(study => {
        if (!addedCompanies[study.Company]) { // check if company has already been added
            addedCompanies[study.Company] = true; // mark company as added
            companyList.push({
                name: study.Company,
                count: 1
            }); // add company to list with count 1
        } else { // company already added
            // increment count for company
            companyList.find(company => company.name === study.Company).count++;
        }
    });

    // Sort companies alphabetically
    companyList.sort((a, b) => a.name.localeCompare(b.name));

    // Render buttons for each company in sorted list
    companyList.forEach(company => {
        var additionalCompany = document.createElement('button')
        if (!companyFilter.includes(company.name)) { additionalCompany.classList.add('filterBtn') }
        else { additionalCompany.classList.add('filterBtn'); additionalCompany.classList.add('filterBtnSecondary'); }

        additionalCompany.value = company.name
        additionalCompany.innerText = `${company.name} (${company.count})`
        additionalCompany.onclick = () => { toggleCompanyFilter(company.name) }
        document.getElementById('companiesFilter').appendChild(additionalCompany)
    });
    //add the type switch
    var toggle = document.createElement('button')
    toggle.innerText = check ? 'Include' : 'Exclude';
    toggle.onclick = () => { changeCompanyFilterType() }
    toggle.id = 'toggle'
    toggle.style.background = 'none'
    toggle.style.border = 'none'
    toggle.style.textDecoration = 'underline'
    toggle.style.fontWeight = 'bold'
    toggle.style.fontSize = 'small'
    toggle.style.width = '100%'
    toggle.style.textAlign = 'left'
    toggle.style.cursor = 'pointer'
    // Append toggle as the first child of companiesFilter
    document.getElementById('companiesFilter').insertBefore(toggle, document.getElementById('companiesFilter').firstChild);

}



function toggleCompanyFilter(company) {
    const index = companyFilter.indexOf(company);
    if (index > -1) {
        companyFilter.splice(index, 1);
    } else {
        companyFilter.push(company);
    }
    applyCompanyFilter(companyFilter)
}

var check = false
function applyCompanyFilter(companyNames) {
    // prep for filter
    var newArray = tidyResults("[" + document.getElementById('jsonInput').value + "]");

    // apply filter
    newArray = newArray.filter(study => companyNames.includes(study.Company) == check);

    // get json array back to string format that start function expects
    stringVal = JSON.stringify(newArray).slice(1, -1);

    // trigger start function
    start(stringVal, document.getElementById('startdate').value, document.getElementById('enddate').value);
}

function changeCompanyFilterType() {
    check = !check
    applyCompanyFilter(companyFilter)
}

function populateDates() {
    var array = document.getElementById('jsonInput').value
    //tidy the json input
    var studyArray = tidyResults("[" + array + "]");

    var { minDate, maxDate } = studyArray.reduce(
        (accumulator, current) => {
            const { CreatedAt } = current;
            return {
                minDate: CreatedAt < accumulator.minDate ? CreatedAt : accumulator.minDate,
                maxDate: CreatedAt > accumulator.maxDate ? CreatedAt : accumulator.maxDate,
            };
        },
        {
            minDate: studyArray[0].CreatedAt,
            maxDate: studyArray[0].CreatedAt,
        }
    );

    document.getElementById('startdate').value = minDate.slice(0, 10)
    document.getElementById('startdate').setAttribute('min', minDate.slice(0, 10))
    document.getElementById('startdate').setAttribute('max', maxDate.slice(0, 10))
    document.getElementById('enddate').value = maxDate.slice(0, 10)
    document.getElementById('enddate').setAttribute('min', minDate.slice(0, 10))
    document.getElementById('enddate').setAttribute('max', maxDate.slice(0, 10))
}

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
    var sum = 0;
    var average = 0;
    if (numberOfHotspots.length === 0) {
        sum = 0;
        average = 0;
    } else {
        sum = numberOfHotspots.reduce((acc, val) => acc + val);
        average = sum / numberOfHotspots.length;
    }


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

    var sum = 0;
    var average = 0;
    if (digestibilityArray.length === 0) {
        sum = 0;
        average = 0;
    } else {
        sum = digestibilityArray.reduce((acc, val) => acc + val);
        average = sum / digestibilityArray.length;
    }

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
    displayDigestibilityVsHotspotCount(studyArray)
    displayAspectRatios(studyArray)
    displayStudiesOverTime(studyArray)
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
                            type: shape.type,
                            height: shape.height,
                            width: shape.width
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
    displayAoiAspectRatios()
}

function showHideCode() {
    if (document.getElementById('code').style.maxHeight == '0px') {
        document.getElementById('code').style.maxHeight = '400px'
    }
    else {
        document.getElementById('code').style.maxHeight = '0px'
    }
}

function copy() {
    var code = document.getElementById("code");
    var range = document.createRange();
    range.selectNode(code);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.execCommand("copy");
    alert("Copied to clipboard!");
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

function tidyResults(str) {
    if (typeof str !== "string") {
        throw new TypeError("tidyResults expects a string");
    }

    str = str.replace(/(https?:\/\/(?!")[^\s,]+)(?<!")(\s*,)/g, '"$1"$2');

    //check for empty studies and remove - this handles up to three in a row either at the start, somewhere in the middle, or at the end
    var counter = 0
    str = str.replace(/(?:\r\n|\r|\n)/g, '')
    str = str.replace("}[]{", () => { counter++; return ("}{") })
    str = str.replace("}[][]{", () => { counter++; return ("}{") })
    str = str.replace("}[][][]{", () => { counter++; return ("}{") })
    str = str.replace("[]{", () => { counter++; return ("{") })
    str = str.replace("[][]{", () => { counter++; return ("{") })
    str = str.replace("[][][]{", () => { counter++; return ("{") })
    str = str.replace("}[]", () => { counter++; return ("}") })
    str = str.replace("}[][]", () => { counter++; return ("}") })
    str = str.replace("}[][]", () => { counter++; return ("}") })
    console.log("replacements (studies without data) = " + counter)
    return JSON.parse(addCommasToJsonString(str));
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

    // replace old names with new 
    let gaze_pathIndex = labels.indexOf("gaze_path");
    if (gaze_pathIndex !== -1) {
        labels[gaze_pathIndex] = "hotspots";
    }
    let hotspotsIndex = labels.indexOf("hotspots");
    if (hotspotsIndex !== -1) {
        labels[hotspotsIndex] = "grid";
    }


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
        chart: {
            type: 'donut',
            height: 280
        },
        series: data,
        labels: labels,
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
        }],

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
    document.getElementById("companiesFilter").innerHTML = "";
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

function displayDigestibilityVsHotspotCount(studyArray) {
    theCanvas = document.createElement("div");
    theCanvas.className = "chartCard";
    theCanvas.id = "digestibilityVsHotspots";
    document.getElementById("output").appendChild(theCanvas);

    arr = []

    studyArray.forEach(study => {
        study.stages.forEach(stage => {
            if (stage.hotspots) {
                if (stage.hotspots.center) {
                    arr.push({
                        digestibility: stage.hotspots.center.digestibilityScore,
                        hotspots: stage.hotspots.center.hotspots.length
                    })
                } else if (stage.hotspots.none) {
                    arr.push({
                        digestibility: stage.hotspots.none.digestibilityScore,
                        hotspots: stage.hotspots.none.hotspots.length
                    })
                }
                else {
                    arr.push({
                        digestibility: stage.hotspots.digestibilityScore,
                        hotspots: stage.hotspots.length
                    })
                }

            }

        })
    })

    const filteredData = arr.filter(item => item.digestibility !== undefined && item.hotspots !== undefined);

    // Create an apexchart scatter plot
    var options = {
        title: {
            text: 'Digestibility vs Hotspot Frequency',
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
            name: "digestibility/hotspots",
            data: filteredData.map(obj => ({ y: obj.hotspots, x: obj.digestibility }))
        }
        ],
        xaxis: {
            title: {
                show: true,
                text: 'Digestibility'
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
                show: true,
                text: 'Hotspots'
            }
        }

    }
    var chart = new ApexCharts(document.getElementById("digestibilityVsHotspots"), options);
    chart.render()
}

function displayAspectRatios(studyArray) {

    theCanvas = document.createElement("div");
    theCanvas.className = "chartCard";
    theCanvas.id = "ImageAspectRatios";
    document.getElementById("output").appendChild(theCanvas);


    ratioArray = []
    studyArray.forEach(study => {
        study.stages.forEach(stage => {
            if (stage.imageHeight && stage.imageWidth) {

                ratioArray.push(roundAspectRatio(stage.imageWidth, stage.imageHeight))

            }

        })
    })

    const summary = ratioArray.reduce((acc, curr) => {
        if (!acc[curr]) {
            acc[curr] = 1;
        } else {
            acc[curr]++;
        }
        return acc;
    }, {});

    //sort
    const sortedSummary = Object.fromEntries(Object.entries(summary).sort((a, b) => b[1] - a[1]));

    var options = {
        events: {
            mounted: (chart) => {
                chart.windowResizeHandler();
            }
        },
        series: [{
            name: "Data",
            type: "bar",
            data: Object.values(sortedSummary)
        }],
        labels: Object.keys(sortedSummary),
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
            type: 'line',
            height: 280
        },
        plotOptions: {
            bar: {
                columnWidth: '50%',
            },
            line: {
                curve: 'straight'
            }
        },
        xaxis: {
            max: 10
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




    var chart = new ApexCharts(document.getElementById("ImageAspectRatios"), options);
    chart.render();



}

function displayAoiAspectRatios() {

    theCanvas = document.createElement("div");
    theCanvas.className = "chartCard";
    theCanvas.id = "AoiAspectRatios";
    document.getElementById("output").appendChild(theCanvas);


    ratioArray = []

    aoiData.forEach(aoi => {
        if (aoi.height && aoi.width) {

            ratioArray.push(roundAspectRatio(aoi.width, aoi.height))

        }

    })


    const summary = ratioArray.reduce((acc, curr) => {
        if (!acc[curr]) {
            acc[curr] = 1;
        } else {
            acc[curr]++;
        }
        return acc;
    }, {});

    //sort
    const sortedSummary = Object.fromEntries(Object.entries(summary).sort((a, b) => b[1] - a[1]));



    var options = {
        events: {
            mounted: (chart) => {
                chart.windowResizeHandler();
            }
        },
        series: [{
            name: "Data",
            type: "bar",
            data: Object.values(sortedSummary)
        }],
        labels: Object.keys(sortedSummary),
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
            type: 'line',
            height: 280
        },
        plotOptions: {
            bar: {
                columnWidth: '50%',
            },
            line: {
                curve: 'straight'
            }
        },
        xaxis: {
            max: 10
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




    var chart = new ApexCharts(document.getElementById("AoiAspectRatios"), options);
    chart.render();



}

function roundAspectRatio(width, height) {
    // Calculate the aspect ratio
    const aspectRatio = width / height;

    // Define the commonly used ratios
    const ratios = ["16:9", "9:16", "1:1", "4:3", "3:4", "191:100", "100:191", "2:3", "3:2", "5:4", "4:5", "2:1", "1:2", "16:10", "10:16", "21:9", "9:21", "9:1", "1:9", "1371:1000", "1000:1371", "6:5", "5:6", "8:1", "1:8", "3:10", "10:3", "39:10", "10:39"];

    // Loop through the ratios and check if the aspect ratio is within x% tolerance
    for (let i = 0; i < ratios.length; i++) {
        const ratio = ratios[i];
        const [numerator, denominator] = ratio.split(":").map(Number);
        const tolerance = 0.1 * numerator / denominator;
        const lowerBound = ratio - tolerance;
        const upperBound = ratio + tolerance;
        if (aspectRatio >= lowerBound && aspectRatio <= upperBound) {
            // Return the rounded ratio if it's within tolerance
            return ratio;
        }
    }

    // If the aspect ratio is not within tolerance of any of the ratios, simplify the aspect ratio
    const gcd = getGcd(width, height);
    const simplifiedWidth = width / gcd;
    const simplifiedHeight = height / gcd;
    return `${simplifiedWidth}:${simplifiedHeight}`;
}

// Helper function to calculate the greatest common divisor (GCD) of two numbers
function getGcd(a, b) {
    if (b === 0) {
        return a;
    } else {
        return getGcd(b, a % b);
    }
}

function displayStudiesOverTime(studyArray) {
    const theCanvas = document.createElement("div");
    theCanvas.className = "chartCard";
    theCanvas.id = "studiesOverTime";
    document.getElementById("output").appendChild(theCanvas);
    const data = studyArray.reduce((acc, study) => {
        const studyDate = new Date(study.CreatedAt);
        const year = studyDate.getFullYear();
        const month = studyDate.getMonth();
        const weekNumber = getWeekNumber(studyDate);
        const weekData = acc.find((x) => x.x === weekNumber);
        if (weekData) {
            weekData.y++;
        } else {
            acc.push({
                x: weekNumber,
                y: 1
            });
        }
        return acc;
    }, []).sort((a, b) => a.x - b.x);

    const options = {
        title: {
            text: theCanvas.id + ' by Week',
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
        stroke: {
            curve: 'smooth'
        },
        series: [{
            data: data,
            type: 'area'
        }],
        chart: {
            type: "line",
            height: 280
        },
        xaxis: {
            type: "datetime",
            tickAmount: 'dataSteps',
            labels: {
                datetimeFormatter: {
                    year: 'yyyy',
                    month: "MMM 'yy",
                    day: 'dd MMM',
                    hour: 'HH:mm'
                }
            },
            min: data[0].x,
            max: data[data.length - 1].x,
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'smooth'
        },
    };
    const chart = new ApexCharts(document.getElementById("studiesOverTime"), options);
    chart.render();
}

function getWeekNumber(date) {
    const onejan = new Date(date.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((date - onejan) / 86400000 + onejan.getDay() + 1) / 7);
    const year = date.getFullYear();
    return new Date(year, 0, (weekNumber - 1) * 7).getTime();
}









