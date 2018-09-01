var selectedLogics = [];
var width;
var height;
var scaleX;
var scaleColour;
var svg;
var g;
var gRelationships;
var timeline;
var antecedentTimeline;
var lastSelectedID; 
var selectedKeywords = new Map();
var lineFunction = d3.line()
                       .x(function(d) { return d.x; })
                       .y(function(d) { return d.y; })
                       .curve(d3.curveMonotoneY);
$("#keywordsSearchInput").on("input", addKeyword);
$("#list").delegate(".listelement", "click", function(){
     var elemId = $(this).attr('data-id');
     d3.select("#"+elemId).transition()
        .ease(d3.easeCubic)
        .duration("100")
        .style("opacity", 0)
        .remove();
     selectedKeywords.delete(parseInt(elemId.split("kw")[1]));   
});

renderSVG();
getLogicIDs(); 
function addKeyword(){
    var val = $(this).val();
    if($('#relatedKeywords').find('option').filter(function(){
        return this.value.toUpperCase() === val.toUpperCase();        
    }).length) {
       var id = $("#relatedKeywords [value='"+val+"']").data("id"); 
       selectedKeywords.set(id, val);
       $('#list').append('<li id="'+"kw"+id+'"><input type="button" data-id="'+"kw"+id+'" class="listelement" value="X" /> '+val+'<input type="hidden" name="listed[]" value="'+val+'"></li>');
       console.log(selectedKeywords);
       getTheoriesFromKeywords(); 
    }
}
function getTheoriesFromKeywords(){
    if(g.selectAll(".timelineCircle").data().length == 0){
        return;
    }
    var ids = [];
    for(datum of g.selectAll(".timelineCircle").data()){
        ids.push(datum.theoryID);
    }
    $.post("gettheoriesbykeywords", 
        { ids : ids, keywords : Array.from(selectedKeywords.keys()) },
        update);
}
function keywordsSwitch(){
    if(document.getElementById("keywordsSwitch").checked == true){
        $("#keywordsSearchInput").prop("disabled", false);
    }else{
        $("#keywordsSearchInput").prop("disabled", true);
    }
}
function getPosNeg(){
    if(g.selectAll(".timelineCircle").data().length == 0){
        return;
    }
    var ids = [];
    for(datum of g.selectAll(".timelineCircle").data()){
        ids.push(datum.theoryID);
    }
    for(datum of g.selectAll(".antecedentTimelineCircle").data()){
        ids.push(datum.theoryID);
    }
    if(document.getElementById("posNegSwitch").checked == true){
        $.post("getPosNeg", { ids : ids, logicIds : selectedLogics },
            function(data, status){
                for(datum of data){
                    g.select("#tc"+datum.theoryID)
                        .attr("fill",function(){
                            return datum.logicsPositiveSecurity == 1 ? "#98e29a" : "#e08888"
                        })
                        .attr("data-posneg",function(){
                            return datum.logicsPositiveSecurity == 1 ? "#98e29a" : "#e08888"
                        });
                    gRelationships.selectAll("#r"+datum.theoryID)
                        .attr("stroke",function(){
                            return datum.logicsPositiveSecurity == 1 ? "#98e29a" : "#e08888"
                        });
                }
            });
    }else{
        for(circle of ids){
            g.select("#tc"+circle)
                .attr("fill", function(d){
                    return d3.interpolateRainbow(d.theoryID/30);
                });
            gRelationships.selectAll("#r"+circle)
                .attr("stroke", function(d){
                    return d3.interpolateRainbow(d.theoryID/30);
                });
        }
    }
}
function getRelationships(){
    if(selectedLogics.length == 0){
        gRelationships.selectAll(".relationships")
            .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .style("opacity",0)
            .remove();  
         gRelationships.selectAll(".antecedentRelationships")
            .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .style("opacity",0)
            .remove();
        return;
    }
    if(g.selectAll(".timelineCircle").data().length == 0){
        return;
    }
    var ids = [];
    for(datum of g.selectAll(".timelineCircle").data()){
        ids.push(datum.theoryID);
    }
    if(document.getElementById("relationshipsSwitch").checked == true){
        $.post("getRelationships", { ids : ids, logicIds : selectedLogics},
            function(data, status){
                scaleX = d3.scaleLinear()
                    .domain([data[0].theoryYear,
                        data[data.length-1].theoryYear])
                    .range([10, width-10]);
                var relationships = gRelationships.selectAll(".relationships")
                    .data(data)
                relationships.enter()
                    .append("path").merge(relationships)
                    .attr("d", function(d){
                        var logicCircle = g.select("#c"+d.logicID);
                        return lineFunction([{"x": logicCircle.attr("cx"), "y" : logicCircle. attr("cy")},
                            {"x" : logicCircle.attr("cx"), "y" : (height/6)*2},
                            {"x" : scaleX(d.theoryYear), "y" : timeline.attr("y")-10},
                            {"x" : scaleX(d.theoryYear), "y" : timeline.attr("y")}])
                    })
                    .attr("stroke", function(d){
                        return document.getElementById("posNegSwitch").checked == true ? 
                            d3.select("#tc"+d.theoryID).attr("data-posneg") : d3.interpolateRainbow(d.theoryID/30);
                    })
                    .attr("class", "relationships")
                    .attr("id", function(d) { return "r"+d.theoryID})
                    .attr("stroke-width", 2)
                    .attr("fill", "none")
                    .style("opacity", 0)
                    .transition().ease(d3.easeCubic).duration("250").style("opacity",1);
                relationships.exit().remove();
            }
        );
        if(g.selectAll(".antecedentTimelineCircle").data().length == 0){
            return;
        }
        ids = [];
        for(datum of g.selectAll(".antecedentTimelineCircle").data()){
            ids.push(datum.theoryID);
        }
        $.post("getRelationships", { ids : ids, logicIds : selectedLogics},
            function(data, status){
                if(data.length == 0) { 
                    gRelationships.selectAll(".antecedentRelationships")
                        .transition()
                        .ease(d3.easeCubic)
                        .duration("250")
                        .style("opacity",0)
                        .remove();       
                    return
                } 
                scaleX = d3.scaleLinear()
                    .domain([data[0].theoryYear,
                        data[data.length-1].theoryYear])
                    .range([10, width-10]);
                var relationships = gRelationships.selectAll(".antecedentRelationships")
                    .data(data)
                relationships.enter()
                    .append("path").merge(relationships)
                    .attr("d", function(d){
                        var logicCircle = g.select("#c"+d.logicID);
                        return lineFunction([{"x": logicCircle.attr("cx"), "y" : logicCircle. attr("cy")},
                            {"x" : logicCircle.attr("cx"), "y" : (height/6)*4},
                            {"x" : scaleX(d.theoryYear), "y" : antecedentTimeline.attr("y")-10},
                            {"x" : scaleX(d.theoryYear), "y" : antecedentTimeline.attr("y")}])
                    })
                    .attr("stroke", function(d){
                        return document.getElementById("posNegSwitch").checked == true ? 
                            d3.select("#tc"+d.theoryID).attr("data-posneg") : d3.interpolateRainbow(d.theoryID/30);
                    })    
                    .attr("class", "antecedentRelationships")
                    .attr("id", function(d){return "r"+d.theoryID})
                    .attr("stroke-width", 2)
                    .attr("fill", "none")
                    .style("opacity", 0)
                    .transition().ease(d3.easeCubic).duration("250").style("opacity",1);
                relationships.exit().remove();
            }
        );
    }else{
        gRelationships.selectAll(".relationships")
            .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .style("opacity",0)
            .remove();        
        gRelationships.selectAll(".antecedentRelationships")
            .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .style("opacity",0)
            .remove();       
    }
}

function getKeywords(){
    var word = document.getElementById("keywordsSearchInput").value;
    $.post("getkeywordsbyinput", { keyword : word }, 
        function(data, status){
            document.getElementById('relatedKeywords').innerHTML = '';
            for(datum of data){
                $('#relatedKeywords').append("<option data-id='"+ datum.id +"' value='"+datum.keyword+"'>");
            }
        });
}

function getLogicIDs(){
    $.get("getlogicidsandnames", function(data){
        renderLogicCircle(data); 
    });
}
function renderLogicCircle(data){
    scaleColour = d3.scaleQuantize()
        .domain([getMinLogicID(data),getMaxLogicID(data)])
        .range(d3.schemePastel1);
    var radius = (height/5)*0.4;

    //g.append("circle")
    //    .attr("cx", width/2)
    //    .attr("cy", height/6)
    //    .attr("r", radius)
    //    .attr("fill", "none")
    //    .attr("stroke-width", 2)
    //    .attr("stroke", "lightgrey");

    var incrementAngle = 360/data.length;

    g.selectAll("logicCircle")
        .data(data)
        .enter()
        .append("circle")
        .attr("data-clicked", 0)
        .attr("class", "logicCircle")
        .attr("id", function(d){ return "c"+d.id;})
        .attr("cx", function(d, i){
            return (radius * Math.cos(Math.radians(i * incrementAngle-18)))+width/2;
        })
        .attr("cy", function(d, i){
            return (radius * Math.sin(Math.radians(i * incrementAngle-18)))+height/6;
        })
        .attr("r", 1)
        .attr("fill","#7f7f7f")
        .on("mouseover", mouseOverLogicCircle)
        .on("mouseout", mouseOutLogicCircle)
        .on("click", selectLogicAndShow)
        .transition()
        .ease(d3.easeCubic)
        .duration("250")
        .attr("r", 7);
    
    var fontSize = 16;

    g.selectAll("logicText")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "logicCircleName")
        .attr("id", function(d){return "t"+d.id;})
        .attr("data-clicked", 0)
        .attr("x", function(d, i){
            var degrees = (i * incrementAngle-18);
            return degrees >= 90 && degrees <= 260 ? ((radius * Math.cos(Math.radians(degrees)))+width/2)-14 : ((radius * Math.cos(Math.radians(degrees)))+width/2)+14;
        })
        .attr("y",  function(d, i){
            var degrees = (i * incrementAngle-18);
            return degrees >= 265 && degrees <= 300 ? (radius * Math.sin(Math.radians(degrees)))+(height/6)-4: (radius * Math.sin(Math.radians(degrees)))+height/6+4;
        })
        .attr("text-anchor", function(d, i){
            var degrees = i * incrementAngle;
            return degrees >= 90 && degrees <= 270 ? "end" : "start"; 
        })
        .attr("fill", "#5b5b5b")
        .text(function(d){
            return d.logicsName;
        }).style("font-size", fontSize+"px")
        .style("font-family", "'Oswald', sans-serif")
        .on("mouseover", mouseOverLogicName)
        .on("mouseout", mouseOutLogicName)
        .on("click", selectLogicAndShow);
}

function update(data, status){
    if(data.length == 0){ 
        g.selectAll(".timelineCircle").transition()
            .ease(d3.easeCubic).duration("250").attr("r",1).remove();
        g.selectAll(".titles").transition().ease(d3.easeCubic).duration("250")
            .style("font-size", "1px").remove();        
        updateAntecedents();
        getRelationships();
        return;
    }
    scaleX = d3.scaleLinear()
        .domain([data[0].theoryYear,
            data[data.length-1].theoryYear])
        .range([10, width-10]);

    var timelineCircle = g.selectAll(".timelineCircle")
        .data(data, function(d) { return d.theoryID });

    timelineCircle.enter()
        .append("circle").merge(timelineCircle)
        .attr("class", "timelineCircle")
        .attr("data-clicked", 0) 
        .attr("id", function(d){ return "tc"+d.theoryID})
        .attr("cx", function(d){ 
            return scaleX(d.theoryYear);
        })
        .attr("cy", (height/2)+5)
        .attr("r", 1)
        .attr("fill", function(d){ 
            return d3.interpolateRainbow(d.theoryID/30)})
        .on("mouseover", handleTheoryMouseOver)
        .on("mouseout", handleTheoryMouseOut)
        .on("click", handleTheoryClick)
        .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("r", 10);
    timelineCircle.exit().remove(); 

    var text = g.selectAll(".titles").data(data, function(d) { d.theoryID });
    
    text.enter()
        .append("text").merge(text)
        .attr("class", "titles")
        .attr("data-clicked", 0)
        .attr("id", function(d){ return "tt"+d.theoryID})
        .attr("x", function(d){
            return scaleX(d.theoryYear);
        })
        .attr("y", (height/2)-5)
        .attr("transform", function(d) { 
            return "rotate(-45,"+scaleX(d.theoryYear)+","+((height/2)-5)+")"
        })
        .text(function(d){ return d.theoryYear + " - " + d.theoryName})
        .style("font-size", "1px")
        .style("font-family", "'Oswald', sans-serif")
        .attr("fill", "#5b5b5b")
        .on("mouseover", handleTheoryMouseOver)
        .on("mouseout", handleTheoryMouseOut)
        .on("click", handleTheoryClick)
        .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .style("font-size","12px");
    text.exit().remove();
    updateAntecedents();
}
function updateAntecedents(){

    $.post("gettheoriesbylogicsantecedents", {ids : selectedLogics},
         function(data, status){
              if(data.length == 0){ 
                  g.selectAll(".antecedentTimelineCircle").transition()
                      .ease(d3.easeCubic)
                      .duration("250")
                      .attr("r",1)
                      .remove();
                  g.selectAll(".antecedentTitles")
                      .transition()
                      .ease(d3.easeCubic)
                      .duration("250")
                      .style("font-size", "1px").remove();        
                  getRelationships();
                  getPosNeg();
                  return
              }
              scaleX = d3.scaleLinear()
                  .domain([data[0].theoryYear,
                      data[data.length-1].theoryYear])
                  .range([10, width-10]);
              var timelineCircle = g.selectAll(".antecedentTimelineCircle")
                  .data(data, function(d) { return d.theoryID });

              timelineCircle.enter()
                  .append("circle").merge(timelineCircle)
                  .attr("data-clicked", 0)
                  .attr("class", "antecedentTimelineCircle")
                  .attr("id", function(d){ return "tc"+d.theoryID;})
                  .attr("cx", function(d){ 
                      return scaleX(d.theoryYear);
                  })
                  .attr("cy", ((height/5)*4)+5)
                  .attr("r", 1)
                  .attr("fill", function(d){ 
                      return d3.interpolateRainbow(d.theoryID/30)})
                  .on("mouseover", handleTheoryMouseOver)
                  .on("mouseout", handleTheoryMouseOut)
                  .on("click", handleTheoryClick)
                  .transition()
                      .ease(d3.easeCubic)
                      .duration("250")
                      .attr("r", 10);
              timelineCircle.exit().remove(); 

              var text = g.selectAll(".antecedentTitles")
                 .data(data, function(d) { d.theoryID });
              
              text.enter()
                  .append("text").merge(text)
                  .attr("class", "antecedentTitles")
                  .attr("data-clicked", 0)
                  .attr("id", function(d) { return "tt"+d.theoryID})
                  .attr("x", function(d){
                      return scaleX(d.theoryYear);
                  })
                  .attr("y", ((height/5)*4)-5)
                  .attr("transform", function(d) { 
                      return "rotate(-45,"+scaleX(d.theoryYear)+","+(((height/5)*4)-5)+")"
                  })
                  .text(function(d){ return (d.theoryYear + " - " + d.theoryName)})
                  .style("font-size", "1px")
                  .style("font-family", "'Oswald', sans-serif")
                  .attr("fill", "#5b5b5b")
                  .on("mouseover", handleTheoryMouseOver)
                  .on("mouseout", handleTheoryMouseOut)
                  .on("click", handleTheoryClick)
                  .transition().ease(d3.easeCubic).duration("250").style("font-size","12px");
              text.exit().remove();
              getRelationships();
              getPosNeg();
         });
}
function handleTheoryMouseOver(d,i){
    if(d3.select("#tt"+d.theoryID).attr("data-clicked") == 0){
        d3.select("#tt"+d.theoryID).transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", "#212121");
        d3.select("#tc"+d.theoryID)
            .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", "#f2f2f2");
    }
}

function handleTheoryMouseOut(d,i){
    if(d3.select("#tt"+d.theoryID).attr("data-clicked") != 1){
        d3.select("#tt"+d.theoryID).transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", "#5b5b5b");
        d3.select("#tc"+d.theoryID).transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", function(){
                 return document.getElementById("posNegSwitch").checked == true ? 
                    d3.select("#tc"+d.theoryID).attr("data-posneg") : d3.interpolateRainbow(d.theoryID/30);
            });
    }
}

function handleTheoryClick(d,i){
    var circle = d3.select("#tc"+d.theoryID);
    var text = d3.select("#tt"+d.theoryID);
    if(circle.attr("data-clicked") == 0 || text.attr("data-clicked") == 0){
        if(lastSelectedID != null){
           d3.select("#tt"+lastSelectedID).transition()
                .ease(d3.easeCubic)
                .duration("250")
                .attr("fill","#5b5b5b");
           d3.select("#tc"+lastSelectedID).transition()
                .ease(d3.easeCubic)
                .duration("250")
                .attr("fill", function(){
                    return document.getElementById("posNegSwitch").checked == true ? 
                        d3.select("#tc"+d.theoryID).attr("data-posneg") : d3.interpolateRainbow(d.theoryID/30);
                });
        }    
        text.attr("data-clicked", 1);
        circle.attr("data-clicked", 1);
        lastSelectedID = d.theoryID;  
        text.transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", "#212121");
        circle.transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill","#f2f2f2"); 
        $.post("gettheorysummary",
            { id : d.theoryID }, 
            function(data, status){
                if(circle.attr("class") == "antecedentTimelineCircle"){
                    d3.select("#antecedentTheorySummary")
                        .style("display", "block")
                        .transition()
                        .ease(d3.easeCubic)
                        .duration("250")
                        .style("opacity", 1.0);
                    d3.select("#antecedentTheorySummaryTitle")
                        .text(d.theoryName);
                    d3.select("#antecedentTheorySummaryContent")
                        .text(data.theorySummary);
                }else{
                    d3.select("#theorySummary")
                        .style("display", "block")
                        .transition()
                        .ease(d3.easeCubic)
                        .duration("250")
                        .style("opacity", 1.0);
                    d3.select("#theorySummaryTitle")
                        .text(d.theoryName);
                    d3.select("#theorySummaryContent")
                        .text(data.theorySummary);
                }
            });
    }else{
        if(circle.attr("class") == "antecedentTimelineCircle"){
            d3.select("#antecedentTheorySummary")
                .transition().ease(d3.easeCubic)
                .duration("250").style("opacity", 0).on("end", 
                    function(){d3.select("#antecedentTheorySummary").style("display", "none");});
        }else{
            d3.select("#theorySummary")
                .transition().ease(d3.easeCubic)
                .duration("250").style("opacity", 0).on("end", 
                    function(){d3.select("#theorySummary").style("display", "none");});
        }
        text.attr("data-clicked", 0);
        circle.attr("data-clicked", 0);
        circle.transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", function(){
                return document.getElementById("posNegSwitch").checked == true ? 
                    d3.select("#tc"+d.theoryID).attr("data-posneg") : d3.interpolateRainbow(d.theoryID/30);
            });
        text.transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", "#5b5b5b");
    }
}
function selectLogicAndShow(d,i){
    var circle = d3.select("#c"+d.id);
    var text = d3.select("#t"+d.id); 
    if(circle.attr("data-clicked") == 0 || text.attr("data-clicked") == 0){
        $.post("getlogicsummary",
            { id : d.id }, 
            function(data, status){
                selectedLogics.push(d.id);
                d3.select("#logicSummary")
                    .style("display", "block").
                    transition()
                    .ease(d3.easeCubic)
                    .duration("250")
                    .style("opacity", 1.0);
                d3.select("#logicSummaryTitle")
                    .text(d.logicsName);
                d3.select("#logicSummaryContent")
                    .text(data.logicsSummary);
                $.post("gettheoriesbylogics", { ids : selectedLogics },
                    update);
        });
        circle.attr("data-clicked",1);
        text.attr("data-clicked",1);
        circle.transition()
            .ease(d3.easeCubic)
            .duration("500")
            .attr("fill", "#891313")
            .attr("r", 14);
        text.transition()
            .ease(d3.easeCubic)
            .duration("500")
            .attr("fill", "#212121");
    }else{
        d3.select("#logicSummary")
            .transition().ease(d3.easeCubic)
            .duration("250").style("opacity", 0).on("end", 
                function(){d3.select("#logicSummary").style("display", "none");});
        d3.select("#theorySummary")
            .transition().ease(d3.easeCubic)
            .duration("250").style("opacity", 0).on("end", 
                function(){d3.select("#theorySummary").style("display", "none");});
        circle.attr("data-clicked",0);
        text.attr("data-clicked",0);
        circle.transition()
            .ease(d3.easeCubic)
            .duration("200")
            .attr("fill","#7f7f7f" )
            .attr("r", 7);
        text.transition()
            .ease(d3.easeCubic)
            .duration("200")
            .attr("fill","#5b5b5b"); 
        selectedLogics.splice(selectedLogics.findIndex(function(id){ return id == d.id }),1);
        $.post("gettheoriesbylogics", { ids : selectedLogics },
                    update);
    }
}

function mouseOverLogicName(d, i) { 
    if(d3.select(this).attr("data-clicked") == 0){
        d3.select("#c"+d.id).transition()
            .ease(d3.easeCubic)
            .duration("500")
            .attr("fill", "#891313")
            .attr("r", 14);
        d3.select(this).transition()
            .ease(d3.easeCubic)
            .duration("500")
            .attr("fill", "#212121");
    }
}

function mouseOutLogicName(d, i) {
    if(d3.select(this).attr("data-clicked") == 0){
        d3.select("#c"+d.id).transition()
           .ease(d3.easeCubic)
           .duration("200")   
           .attr("fill","#7f7f7f")
           .attr("r", 7);
        d3.select(this).transition()
           .ease(d3.easeCubic)
           .duration("200")
           .attr("fill","#5b5b5b");
    }
}
function mouseOverLogicCircle(d, i) { 
    if(d3.select(this).attr("data-clicked") == 0){
        d3.select(this).transition()
            .ease(d3.easeCubic)
            .duration("500")
            .attr("fill", "#891313")
            .attr("r", 14);
        d3.select("#t"+d.id).transition()
            .ease(d3.easeCubic)
            .duration("500")
            .attr("fill", "#212121");
    }
}

function mouseOutLogicCircle(d, i) {
    if(d3.select(this).attr("data-clicked") == 0){
        d3.select(this).transition()
           .ease(d3.easeCubic)
           .duration("200")   
           .attr("fill","#7f7f7f")
           .attr("r", 7);
        d3.select("#t"+d.id).transition()
           .ease(d3.easeCubic)
           .duration("200")
           .attr("fill","#5b5b5b");
    }
}

function renderSVG(){
    width = document.getElementById('mapContainer').offsetWidth;
    height = document.getElementById('mapContainer').offsetHeight;
    svg = d3.select(".mapContainer")
        .append("svg")
        .attr("id","map") 
        .style("opacity", 0)
        .attr("width", width)
        .attr("height", height)
        .style("pointer-events", "all")
    var svgDefs = svg.append("defs");
    var anteGradient = svgDefs.append("linearGradient")
        .attr("id", "anteGradient");
    anteGradient.append("stop")
        .attr('class', 'stop-leftAnte')
        .attr("offset", "0");
    anteGradient.append("stop")
        .attr("class", "stop-rightAnte")
        .attr("offset", "1");
    var mainGradient = svgDefs.append("linearGradient")
        .attr('id', 'mainGradient');
    mainGradient.append('stop')
                .attr('class', 'stop-left')
                .attr('offset', '0');

    mainGradient.append('stop')
                .attr('class', 'stop-right')
                .attr('offset', '1');

    gRelationships = svg.append("g");
    g = svg.append("g");

    timeline = g.append("rect")
        .classed("filled", true)
        .attr("x", 0)
        .attr("y", height/2)
        .attr("width", width)
        .attr("height", 10)
        .attr("rx","5")
        .attr("ry","5");

    antecedentTimeline = g.append("rect")
        .classed("filledAnte", true)
        .attr("x", 0)
        .attr("y", (height/5)*4)
        .attr("width", width)
        .attr("height", 10)
        .attr("fill", "#444444")
        .attr("rx","5")
        .attr("ry","5");
    svg.transition()
        .ease(d3.easeCubic)
        .duration(1000)
        .style("opacity",1);
}
function getMaxLogicID(data){
    var maxID = data[0].id;
    for(row of data){
        if(row.id > maxID){
            maxID = row.id;
        }
    }  
    return maxID;
}
function getMinLogicID(data){
    var minID = data[0].id;
    for(row of data){
        if(row.id < minID){
            minID = row.id;
        }
    }
    return minID;
}
Math.radians = function(degrees) {
    return degrees * Math.PI / 180;
}
