(function ($) {
    async function make_radar(data, label_lookup, complexity, skeleton) {
        $("#error").hide();
        d3.select('#sentences').html('')

        // for both SKELETON and RADAR
        // get element ID
        var id = '#chart'

        // formatting
        cfg = {
            radius: 5,
            w: 425,
            h: 425,
            factor: 1,
            factorLegend: 1.05,
            levels: 5,
            maxValue: 1,
            radians: 2 * Math.PI,
            opacityArea: 0.5,
            ToRight: 5,
            TranslateX: 120,
            TranslateY: 30,
            ExtraWidthX: 100,
            ExtraWidthY: 120,
            color: d3.scaleOrdinal()
                .domain(['Sing', 'Plur'])
                .range(["#FFD700", "#00BFFF"])
        };

        d3.selectAll('.toggle')
            .transition()
            .duration(1000)
            .style('opacity', '1')

        var Format = d3.format("");

        // for BOTH
        var caseOrder = {
            'N': 0, 'A': 5, 'G': 4, 'L': 3, 'D': 2, 'I': 1
        }

        if (!skeleton) {
            var input_text = $("#contentinput").val();
            var index = label_lookup[input_text];
            if (index === undefined) {
                d3.select('#output').style('display', 'none')
                make_radar(data, label_lookup, 'basic', skeleton=true)
                $("#error").show();
                return false;
            }

            // var label = data[index].pair;
            var full_data = data[index].data;

            $('#input-word').text(input_text)

            if (full_data['pos'] == 'A') {
                $('#pos').text('Adjective')
            } else {
                $('#pos').text('Noun')
            }

            d3.select('#output').style('display', 'block')
            
            // get chart data
            var chart_data = Object()

            var quantity = ['Sing','Plur']
            quantity.forEach(function (qty) { d3.select('#' + qty).text('0') })

            // populate chart data

            quantity.forEach(function (qty) {
                var data = full_data[complexity][qty].data
                // sort chart data
                data = data.sort(function (caseA, caseB) {
                    var axisA = caseA.axis; var axisB = caseB.axis;
                    if (complexity == 'basic') {
                        var a = caseOrder[axisA.slice(0, 1)]
                        var b = caseOrder[axisB.slice(0, 1)]
                    }
                    if (complexity == 'detailed') {
                        var a = caseOrder[axisA.split(' ')[2].replace('(', '').slice(0, 1)]
                        var b = caseOrder[axisB.split(' ')[2].replace('(', '').slice(0, 1)]
                    }
                    return a - b
                })

                chart_data[qty] = data

                // write sing/plur totals on left side
                var qtyTotal = 0;
                data.forEach(function (d) { qtyTotal += d.value })
                d3.select('#'+qty).text(qtyTotal)
            })
            var all_data = [chart_data['Sing'], chart_data['Plur']]

            // get max value to scale chart
            cfg.maxValue = Math.max(cfg.maxValue, d3.max(all_data, function (i) { return d3.max(i.map(function (o) { return o.value; })) }));

            // getting axis vertices and sorting
            var allAxis = (chart_data['Sing'].map(function (i, j) {
                return i.axis
            }));
        }

        // set allAxis if rendering skeleton
        if (skeleton) {
            var allAxis = ['NOM','ACC','GEN','LOC','DAT','INS']
        }


        allAxis.sort(function (axisA, axisB) {
            if (complexity == 'basic') {
                var a = caseOrder[axisA.slice(0, 1)]
                var b = caseOrder[axisB.slice(0, 1)]
                return a - b
            }
            if (complexity == 'detailed') {
                var a = caseOrder[axisA.split(' ')[2].replace('(', '').slice(0, 1)]
                var b = caseOrder[axisB.split(' ')[2].replace('(', '').slice(0, 1)]
                return a - b
            }
        })

        var total = allAxis.length;

        // calc radius length
        var radius = cfg.factor * Math.min(cfg.w / 2, cfg.h / 2);

        // initializing SVG, tooltip
        d3.select(id).select("svg").remove();

        var g = d3.select(id)
            .append("svg")
            .attr("width", 1000)
            .attr("height", cfg.h + cfg.ExtraWidthY*1.5)
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
            .style("stroke-width", "1px")


        // labeling the radar vertices
        var caseColor = d3.scaleOrdinal()
            .domain(['N', 'A', 'G', 'L', 'D', 'I'])
            .range(['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', '#b4654a'])

        var radLabels = axis.append("text")
            .attr("class", "legend ")
            .attr("id", d => formatClass(d))
            .text(function (d) { return d })
            .attr("text-anchor", "middle")
            .attr("dy", "1.5em")
            .attr("fill", function (d) {
                if (d.length > 3) {
                    var padezh = d.split(' ')[2].replace('(', '')
                    return caseColor(padezh.slice(0, 1))
                }
                return caseColor(d.slice(0, 1))
            })
            .attr("transform", function (d, i) { return "translate(0, -10)" })
            .attr("x", function (d, i) {
                return cfg.w / 2 * (1 - cfg.factorLegend * Math.sin(i * cfg.radians / total)) - 60 * Math.sin(i * cfg.radians / total);
            })
            .attr("y", function (d, i) { return cfg.h / 2 * (1 - Math.cos(i * cfg.radians / total)) - 20 * Math.cos(i * cfg.radians / total); });
    


        // hover label on vertices
        // radLabels
        //     .on('mouseover', function (d) {
                // var thisForm = d3.select(this).text();
                // var thisVal = '-'
                // var thisLabel = '/'
                // num_info.forEach(function(num, i) {
                //     chart_data[i].forEach(function(form) {
                //         if (form.axis == thisForm) {
                //             thisVal = form.value;
                //             allLabels = Object.keys(form.micro)
                //             thisLabel = allLabels.join(', ') + ': ' + thisVal
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
            // })
            // .on('mouseout', function () {
            //     tooltip
            //         .transition(200)
            //         .style('opacity', 0);
            //     g.selectAll("polygon")
            //         .transition(200)
            //         .style("fill-opacity", cfg.opacityArea);
            // })

        // filling in radar chart if not skel
        if (!skeleton) {
            // display sentence examples
            $.getJSON('1-7_examples/'+input_text+'.json', function(examples) {
                const senthtml = Array()
                radLabels.on('click',function(vertexCase) {
                    if (complexity == 'basic') {
                        // console.log(Object.values(examples[vertexCase]))
                        Object.values(examples[vertexCase]).forEach(function(sentarr) {
                            sentarr.forEach(function(sent) {
                                senthtml.push('<p>'+sent+'</p>')
                            })
                        })
                        d3.select('#sentences').html(senthtml.join('<br>'))
                    } else {
                        senthtml = examples[vertexCase]
                        d3.select('#sentences').html(senthtml.join('<br>'))
                    }
                })
            
            })


            // for each series (layer of radar chart)
            quantity.forEach(function(qty) {
                var y = chart_data[qty]
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
                    .style("stroke", cfg.color(qty))
                    .attr('points', function (d) {
                        var center = cfg.w / 2;
                        var str = "";
                        for (var pti = 0; pti < d.length; pti++) {
                            str = str + center + "," + center + " ";
                        }
                        return str;
                    })
                    .style("fill", function () {
                        return cfg.color(qty)
                    })
                    .style("fill-opacity", cfg.opacityArea)
                    // polygon hover
                    .on('mouseover', function () {
                        // polygon hover
                        z = "polygon." + d3.select(this).attr("class");
                        g.selectAll("polygon")
                            .transition(200)
                            .style("fill-opacity", 0.1);
                        g.selectAll(z)
                            .transition(200)
                            .style("fill-opacity", .7);
                        d3.select('radius')
                    })
                    .on('mouseout', function () {
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
            quantity.forEach(function(qty) {
                var y = chart_data[qty]

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
                    .attr("id",  j => formatClass(j.axis ))
                    .style("fill", cfg.color(qty)).style("fill-opacity", 0)
    
                    // HOVER ON CIRCLE VERTICES
                    .on('mouseover', function (d, i) {
                        // display form at vertex
                        
                        var axis = formatClass(d.axis)
                        var newlabel = d.axis + ': ' + d.form + ' (' + qty + ')'

                        // d3.select('.legend#' + axis)
                        //     .text(newlabel)
                        //     .attr('transform', 'translate(' + newlabel.length * 1.5 + ',-10)')
    
                        // vertex number label
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

        function formatClass(str) {
            return str.replaceAll(' ','').replaceAll('(','').replaceAll(')','').replaceAll('.','').replaceAll('+','')
        }

    }

    $(document).ready(async function () {
        console.log("ready!");

        $.getJSON("1-7-22_case-radar-data.json", function (data) {
            // remove loading gif
            d3.select("#loading").remove();

            var previous_input = ''
            // create lookup from lemma to array number to avoid looping every time
            var label_lookup = new Object();
            for (var key in data) {
                var full_label = data[key]["label"]
                label_lookup[full_label] = key;
            }

            make_radar(data, label_lookup, 'basic', true)

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
                        make_radar(data, label_lookup, 'basic',false)
                        $('#basic').css('display', 'none')
                        $('#detailed').css('display', 'block')
                        previous_input = $('#contentinput').val()

                    } else {
                        make_radar(data, label_lookup, 'detailed',false)
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
        })
    })

})(jQuery);