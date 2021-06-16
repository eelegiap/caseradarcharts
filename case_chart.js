(function ($) {
    async function make_radar(data, label_lookup, complexity) {
        $("#error").hide();
        var input_text = $("#contentinput").val();
        var index = label_lookup[input_text];
        $('#gauge').empty();
        $('#tr').empty();

        if (index === undefined) {
            d3.select('#output').style('display', 'none')
            draw_skeleton(data, label_lookup, 'basic');
            $("#error").show();
            return false;
        }
        var label = data[index].pair;
        var full_data = data[index].data;
        console.log(full_data)

        $('#input-word').text(input_text)
        $("#pair").text(label);
        if (full_data['pos'] == 'A') {
            $('#pos').text('Adjective')
        } else {
            $('#pos').text('Noun')
        }
        
        d3.select('#output').style('display', 'block')

        var complexity_key
        var nums = []

        Object.keys(full_data[complexity]).forEach(function(qty) {
            if (full_data[complexity][qty].label != 'n/a') {
                nums.push(qty)
            }
        });
        console.log(nums)
        // get chart data
        var chart_data = []
        var num_info = []
        nums.forEach(function(qty) {
            chart_data.push(full_data[complexity][qty].data)
            num_info.push({
                "num": qty,
                "label": full_data[complexity][qty].form
            })
        })
        d3.select('#tr-label').text(label + ' translation: ')
        var translation_found = false

        var id = '#chart'

        var colorRange = ["#FFD700", "#00BFFF", '#AF5BA6', 'gray']
        var lightColorRange = {
            "sg": '#fff6c4',
            "pl": '#9de6ff',
            "n/a": '#AF5BA6a1',
            "no num assigned": 'lightgray'
        }
        // formatting
        cfg = {
            radius: 5,
            w: 425,
            h: 425,
            factor: 1,
            factorLegend: .95,
            levels: 5,
            maxValue: 0.6,
            radians: 2 * Math.PI,
            opacityArea: 0.5,
            ToRight: 5,
            TranslateX: 120,
            TranslateY: 30,
            ExtraWidthX: 100,
            ExtraWidthY: 100,
            color: d3.scaleOrdinal()
                .domain(['sg', 'pl', 'n/a', 'no num assigned'])
                .range(colorRange)
        };

        // set colored verb labels for toggle
        if (num_info.length == 1) {
            d3.select('#verb2').style('display', 'none')
        } else {
            d3.select('#verb2').style('display', 'inline-block')
        }
        num_info.forEach(function (num, i) {
            var verblabel = d3.select('#verb' + (i + 1))
                .classed('activated', true)
                .style('background-color', function () {
                    return lightColorRange[num.num];
                })
                .style('border', '1px solid black')
                .style('border-radius', '3px')
                .text(num.label)

            verblabel.on('click', function () {
                var series = d3.selectAll(".radar-chart-serie" + i);
                var currentOpacity = $(".radar-chart-serie" + i).css('opacity');
                if (currentOpacity == 0) {
                    series.style('opacity', 1)
                    d3.select(this).classed('activated', true)
                    d3.select(this).style('background-color', function () { return lightColorRange[num.num] })
                    d3.select('.output' + (i + 1)).style('opacity', 1)
                } else {
                    series.style('opacity', 0)
                    d3.select(this).classed('activated', false)
                    d3.select(this).style('background-color', 'white')
                    d3.select('.output' + (i + 1)).style('opacity', 0)
                }
            })
            verblabel.on('mouseover', function () {
                var thisclass = d3.select(this).attr('class')
                if (thisclass.includes('activated')) {
                    d3.select(this).style('background-color', function () { return cfg.color(num.num) })
                } else {
                    d3.select(this).style('background-color', 'white')
                }
            })
            verblabel.on('mouseout', function () {
                var thisclass = d3.select(this).attr('class')
                if (thisclass.includes('activated')) {
                    d3.select(this).style('background-color', function () { return lightColorRange[num.num] })
                } else {
                    d3.select(this).style('background-color', 'white')
                }
            })
        })

        d3.selectAll('.toggle')
            .transition()
            .duration(1000)
            .style('opacity', '1')

        var Format = d3.format("");

        // get max value to scale chart
        cfg.maxValue = Math.max(cfg.maxValue, d3.max(chart_data, function (i) { return d3.max(i.map(function (o) { return o.value; })) }));

        // axis names
        var allAxis = (chart_data[0].map(function (i, j) {
            return i.axis
        }));

        var total = allAxis.length;

        // calc radius length
        var radius = cfg.factor * Math.min(cfg.w / 2, cfg.h / 2);

        // initializing SVG, tooltip
        d3.select(id).select("svg").remove();

        var g = d3.select(id)
            .append("svg")
            .attr("width", 1000)
            .attr("height", cfg.h + cfg.ExtraWidthY)
            .append("g")
            .attr("transform", "translate(" + (cfg.TranslateX + 0) + "," + cfg.TranslateY + ")");
        ;
        //Tooltip
        var tooltip = g.append('text')
            .attr('class', 'tooltip')
            .style('opacity', 0)

        // drawing radar concentric axes
        for (var j = 0; j < cfg.levels; j++) {
            var levelFactor = cfg.factor * radius * ((j + 1) / cfg.levels);
            g.selectAll(".levels")
                .data(allAxis)
                .enter()
                .append("svg:line")
                .attr("x1", function (d, i) { return levelFactor * (1 - cfg.factor * Math.sin(i * cfg.radians / total)); })
                .attr("y1", function (d, i) { return levelFactor * (1 - cfg.factor * Math.cos(i * cfg.radians / total)); })
                .attr("x2", function (d, i) { return levelFactor * (1 - cfg.factor * Math.sin((i + 1) * cfg.radians / total)); })
                .attr("y2", function (d, i) { return levelFactor * (1 - cfg.factor * Math.cos((i + 1) * cfg.radians / total)); })
                .attr("class", "line")
                .style("stroke", "grey")
                .style("stroke-opacity", "0.75")
                .style("stroke-width", "0.3px")
                .attr("transform", "translate(" + (cfg.w / 2 - levelFactor) + ", " + (cfg.h / 2 - levelFactor) + ")");
        }

        series = 0;

        // drawing radar radial axes
        var axis = g.selectAll(".axis")
            .data(allAxis)
            .enter()
            .append("g")
            .attr("class", "axis");
        axis.append("line")
            .attr("x1", cfg.w / 2)
            .attr("y1", cfg.h / 2)
            .attr("x2", function (d, i) { return cfg.w / 2 * (1 - cfg.factor * Math.sin(i * cfg.radians / total)); })
            .attr("y2", function (d, i) { return cfg.h / 2 * (1 - cfg.factor * Math.cos(i * cfg.radians / total)); })
            .attr("class", "line")
            .style("stroke", "grey")
            .style("stroke-width", "1px");


        // labeling the radar vertices
        var radLabels = axis.append("text")
            .attr("class", "legend")
            .text(function (d) {return d})
            .attr("text-anchor", "middle")
            .attr("dy", "1.5em")
            .attr("fill", "gray")
            .attr("transform", function (d, i) { return "translate(0, -10)" })
            .attr("x", function (d, i) {
                if (d.includes('imperative') && (i == 6)) {
                    return (cfg.w / 2 * (1 - cfg.factorLegend * Math.sin(i * cfg.radians / total)) - 60 * Math.sin(i * cfg.radians / total) - d.length);
                }
                if (d.includes('1sg') && (i == 7)) {
                    return (cfg.w / 2 * (1 - cfg.factorLegend * Math.sin(i * cfg.radians / total)) - 60 * Math.sin(i * cfg.radians / total) + d.length);
                }
                return cfg.w / 2 * (1 - cfg.factorLegend * Math.sin(i * cfg.radians / total)) - 60 * Math.sin(i * cfg.radians / total);
            })
            .attr("y", function (d, i) { return cfg.h / 2 * (1 - Math.cos(i * cfg.radians / total)) - 20 * Math.cos(i * cfg.radians / total); });

        // hover label on vertices
        radLabels
            .on('mouseover', function (d) {
                // var thisForm = d3.select(this).text();
                // var thisVal = '-'
                // var thisLabel = '/'
                // num_info.forEach(function(num, i) {
                //     chart_data[i].forEach(function(form) {
                //         if (form.axis == thisForm) {
                //             thisVal = form.value;
                //             allLabels = Object.keys(form.micro)
                //             thisLabel = allLabels.join(', ') + ': ' + thisVal
                //             console.log('label',thisLabel)
                //         }
                //     })
                // })


                // newX = parseFloat(d3.select(this).attr('x')) - 50;
                // newY = parseFloat(d3.select(this).attr('y')) + 35;

                // tooltip
                //     .attr('x', newX)
                //     .attr('y', newY)
                //     .text(thisLabel)
                //     .style('fill', 'grey')
                //     .style('font-size','15px')
                //     .transition(200)
                //     .style('opacity', 1);
            })
            .on('mouseout', function () {
                tooltip
                    .transition(200)
                    .style('opacity', 0);
                g.selectAll("polygon")
                    .transition(200)
                    .style("fill-opacity", cfg.opacityArea);
            })
        // for each series (layer of radar chart)
        chart_data.forEach(function (y, i) {
            var this_num_info = num_info[i]
            var verb_label = this_num_info.label
            var this_num = this_num_info.num

            dataValues = [];
            g.selectAll(".nodes")
                .data(y, function (j, i) {
                    dataValues.push([
                        cfg.w / 2 * (1 - (parseFloat(Math.max(j.value, 0)) / cfg.maxValue) * cfg.factor * Math.sin(i * cfg.radians / total)),
                        cfg.h / 2 * (1 - (parseFloat(Math.max(j.value, 0)) / cfg.maxValue) * cfg.factor * Math.cos(i * cfg.radians / total))
                    ]);
                });
            dataValues.push(dataValues[0]);
            // draw polygons
            var polygons = g.selectAll(".area")
                .data([dataValues])
                .enter()
                .append("polygon")
                .attr("class", "radar-chart-serie" + series)
                .style("stroke-width", "2px")
                .style("stroke", cfg.color(this_num))
                .attr('points', function (d) {
                    var center = cfg.w / 2;
                    var str = "";
                    for (var pti = 0; pti < d.length; pti++) {
                        str = str + center + "," + center + " ";
                    }
                    return str;
                })
                .style("fill", function () {
                    return cfg.color(this_num)
                })
                .style("fill-opacity", cfg.opacityArea)
                // polygon hover
                .on('mouseover', function () {
                    d3.select('#verbnum')
                        .append('span')
                        .text(this_num + ': ' + verb_label)
                        .style('color', function () { return cfg.color(this_num) })
                    z = "polygon." + d3.select(this).attr("class");
                    g.selectAll("polygon")
                        .transition(200)
                        .style("fill-opacity", 0.1);
                    g.selectAll(z)
                        .transition(200)
                        .style("fill-opacity", .7);
                })
                .on('mouseout', function () {
                    d3.select('#verbnum').select('span').remove()
                    g.selectAll("polygon")
                        .transition(200)
                        .style("fill-opacity", cfg.opacityArea);
                });

            polygons
                .transition()
                .duration(1500)
                .attr("points", function (d) {
                    var str = "";
                    for (var pti = 0; pti < d.length; pti++) {
                        str = str + d[pti][0] + "," + d[pti][1] + " ";
                    }
                    return str;
                })

            series++;
        });
        series = 0;

        // draws circle vertices of polygon
        chart_data.forEach(function (y, i) {
            var this_num_info = num_info[i]
            var verb_label = this_num_info.label
            var this_num = this_num_info.num

            var vertices = g.selectAll(".nodes")
                .data(y).enter()
                .append("svg:circle")
            vertices
                .attr("class", "radar-chart-serie" + series)
                .attr('r', 5)
                .style("stroke", "transparent")
                .style("stroke-width", "30px")
                .attr("alt", function (j) { return Math.max(j.value, 0) })
                .attr("cx", function (j, i) {
                    dataValues.push([
                        cfg.w / 2 * (1 - (parseFloat(Math.max(j.value, 0)) / cfg.maxValue) * cfg.factor * Math.sin(i * cfg.radians / total)),
                        cfg.h / 2 * (1 - (parseFloat(Math.max(j.value, 0)) / cfg.maxValue) * cfg.factor * Math.cos(i * cfg.radians / total))
                    ]);
                    return cfg.w / 2 * (1 - (Math.max(j.value, 0) / cfg.maxValue) * cfg.factor * Math.sin(i * cfg.radians / total));
                })
                .attr("cy", function (j, i) {
                    return cfg.h / 2 * (1 - (Math.max(j.value, 0) / cfg.maxValue) * cfg.factor * Math.cos(i * cfg.radians / total));
                })
                .attr("data-id", function (j) { return j.axis })
                .style("fill", cfg.color(this_num)).style("fill-opacity", 0)

                // node hover
                .on('mouseover', function (d) {
                    newX = parseFloat(d3.select(this).attr('cx')) - 10;
                    newY = parseFloat(d3.select(this).attr('cy')) - 5;

                    tooltip
                        .attr('x', newX)
                        .attr('y', newY)
                        .style('fill', 'grey')
                        .style('font-size', '15px')
                        .text(Format(d.value))
                        .transition(200)
                        .style('opacity', 1);

                    z = "polygon." + d3.select(this).attr("class");
                    g.selectAll("polygon")
                        .transition(200)
                        .style("fill-opacity", 0.1);
                    g.selectAll(z)
                        .transition(200)
                        .style("fill-opacity", .7);
                })
                .on('mouseout', function () {
                    tooltip
                        .transition(200)
                        .style('opacity', 0);
                    g.selectAll("polygon")
                        .transition(200)
                        .style("fill-opacity", cfg.opacityArea);
                })
                .append("svg:title")
                .text(function (j) { return Math.max(j.value, 0) });

            vertices
                .transition()
                .duration(2000)
                .style("fill-opacity", .9)

            series++;
        });
    }

    function draw_skeleton(data, label_lookup, complexity) {
        $("#error").hide();
        var input_text = 'книга';
        var index = label_lookup[input_text];

        if (index == undefined) {
            $("#error").show();
            return false;
        }
        var full_data = data[index].data;
        // data
        var d = []
        var complexity_key
        var nums = []

        Object.keys(full_data[complexity]).forEach(function(qty) {
            if (full_data[complexity][qty].label != 'n/a') {
                nums.push(qty)
            }
        });
        // get chart data
        var chart_data = []
        var num_info = []
        nums.forEach(function(qty) {
            chart_data.push(full_data[complexity][qty].data)
            num_info.push({
                "num": qty,
                "label": full_data[complexity][qty].form
            })
        })

        var id = '#chart'

        // formatting
        cfg = {
            radius: 5,
            w: 425,
            h: 425,
            factor: 1,
            factorLegend: .95,
            levels: 5,
            maxValue: 0.6,
            radians: 2 * Math.PI,
            opacityArea: 0.5,
            ToRight: 5,
            TranslateX: 80,
            TranslateY: 30,
            ExtraWidthX: 100,
            ExtraWidthY: 100,
            color: d3.scaleOrdinal()
                .domain([0, 1])
                .range(["#AF5BA6"])
        };

        // get max value to scale chart
        cfg.maxValue = Math.max(cfg.maxValue, d3.max(chart_data, function (i) { return d3.max(i.map(function (o) { return o.value; })) }));
        // axis names
        var allAxis = (chart_data[0].map(function (i, j) { return i.axis }));
        var total = allAxis.length;
        // calc radius length
        var radius = cfg.factor * Math.min(cfg.w / 2, cfg.h / 2);

        // initializing SVG
        d3.select(id).select("svg").remove();
        var g = d3.select(id)
            .append("svg")
            .attr("width", 1000)
            .attr("height", cfg.h + cfg.ExtraWidthY)
            .append("g")
            .attr("transform", "translate(" + (cfg.TranslateX + 0) + "," + cfg.TranslateY + ")");


        // drawing radar concentric axes
        for (var j = 0; j < cfg.levels; j++) {
            var levelFactor = cfg.factor * radius * ((j + 1) / cfg.levels);
            g.selectAll(".levels")
                .data(allAxis)
                .enter()
                .append("svg:line")
                .attr("x1", function (d, i) { return levelFactor * (1 - cfg.factor * Math.sin(i * cfg.radians / total)); })
                .attr("y1", function (d, i) { return levelFactor * (1 - cfg.factor * Math.cos(i * cfg.radians / total)); })
                .attr("x2", function (d, i) { return levelFactor * (1 - cfg.factor * Math.sin((i + 1) * cfg.radians / total)); })
                .attr("y2", function (d, i) { return levelFactor * (1 - cfg.factor * Math.cos((i + 1) * cfg.radians / total)); })
                .attr("class", "line")
                .style("stroke", "grey")
                .style("stroke-opacity", "0.75")
                .style("stroke-width", "0.3px")
                .attr("transform", "translate(" + (cfg.w / 2 - levelFactor) + ", " + (cfg.h / 2 - levelFactor) + ")");
        }
        series = 0;

        // drawing radar radial axes
        var axis = g.selectAll(".axis")
            .data(allAxis)
            .enter()
            .append("g")
            .attr("class", "axis");
        axis.append("line")
            .attr("x1", cfg.w / 2)
            .attr("y1", cfg.h / 2)
            .attr("x2", function (d, i) { return cfg.w / 2 * (1 - cfg.factor * Math.sin(i * cfg.radians / total)); })
            .attr("y2", function (d, i) { return cfg.h / 2 * (1 - cfg.factor * Math.cos(i * cfg.radians / total)); })
            .attr("class", "line")
            .style("stroke", "grey")
            .style("stroke-width", "1px");

        // labeling the radar vertices
        axis.append("text")
            .attr("class", "legend")
            .text(function (d) {
                var form = d.split(' ')[0]
                return form;
            })
            .attr("text-anchor", "middle")
            .attr("dy", "1.5em")
            .attr("fill", "gray")
            .attr("transform", function (d, i) { return "translate(0, -10)" })
            .attr("x", function (d, i) { return cfg.w / 2 * (1 - cfg.factorLegend * Math.sin(i * cfg.radians / total)) - 60 * Math.sin(i * cfg.radians / total); })
            .attr("y", function (d, i) { return cfg.h / 2 * (1 - Math.cos(i * cfg.radians / total)) - 20 * Math.cos(i * cfg.radians / total); });

    }
    $(document).ready(async function () {
        console.log("ready!");
        $.getJSON("case_data.json", function (data) {
            var previous_input = ''
            // create lookup from lemma to array number to avoid looping every time
            var label_lookup = new Object();
            for (var key in data) {
                var full_label = data[key]["label"]
                    label_lookup[full_label] = key;
            }
            // make_radar(data, label_lookup, 'basic')
            draw_skeleton(data, label_lookup, 'basic');

            $("#basic").on("click", function () {
                make_radar(data, label_lookup, 'basic');
                $('#basic').css('display', 'none')
                $('#detailed').css('display', 'block')
                previous_input = $('#contentinput').val()
            });
            $('#detailed').on('click', function () {
                make_radar(data, label_lookup, 'detailed');
                $('#detailed').css('display', 'none')
                $('#basic').css('display', 'block')
                previous_input = $('#contentinput').val()
            })

            $('#contentinput').keydown(function (event) {
                let keyPressed = event.keyCode || event.which;
                // enter
                if (keyPressed === 13) {
                    if ($('#basic').css('display') == 'block') {
                        make_radar(data, label_lookup, 'basic')
                        $('#basic').css('display', 'none')
                        $('#detailed').css('display', 'block')
                        previous_input = $('#contentinput').val()

                    } else {
                        make_radar(data, label_lookup, 'detailed')
                        $('#detailed').css('display', 'none')
                        $('#basic').css('display', 'block')
                        previous_input = $('#contentinput').val()
                    }
                    event.preventDefault();
                }
                // space
                else if (keyPressed == 32) {
                    event.preventDefault()
                }
                else {
                    $('#detailed').css('display', 'none')
                    $('#basic').css('display', 'block')
                }
            });
        });
    });

    // Just execute "demo()" in the console to populate the input with sample HTML.
    window.demo = function () {
        var input_list = 'дерево';
        $("#contentinput").val(input_list);
    }

})(jQuery);