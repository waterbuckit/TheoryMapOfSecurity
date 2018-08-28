var selectedLogics = []
var width;
var height;
var scaleX;
var scaleColour;
var svg;
var g;
var timeline;
var antecedentsTimeline;
var lastSelectedID; 
renderSVG();
getLogicIDs();  
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

    g.append("circle")
        .attr("cx", width/2)
        .attr("cy", height/6)
        .attr("r", radius)
        .attr("fill", "none")
        .attr("stroke-width", 2)
        .attr("stroke", "lightgrey");

    var incrementAngle = 360/data.length;

    g.selectAll("logicCircle")
        .data(data)
        .enter()
        .append("circle")
        .attr("data-clicked", 0)
        .attr("class", "logicCircle")
        .attr("id", function(d){ return "c"+d.id;})
        .attr("cx", function(d, i){
            return (radius * Math.cos(Math.radians(i * incrementAngle)))+width/2;
        })
        .attr("cy", function(d, i){
            return (radius * Math.sin(Math.radians(i * incrementAngle)))+height/6;
        })
        .attr("r", 7)
        .attr("fill","#7f7f7f")
        .on("mouseover", mouseOverLogicCircle)
        .on("mouseout", mouseOutLogicCircle)
        .on("click", selectLogicAndShow);
    
    var fontSize = 16;

    g.selectAll("logicText")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "logicCircleName")
        .attr("id", function(d){return "t"+d.id;})
        .attr("data-clicked", 0)
        .attr("x", function(d, i){
            var degrees = (i * incrementAngle);
            return degrees >= 90 && degrees <= 270 ? ((radius * Math.cos(Math.radians(degrees)))+width/2)-10 : ((radius * Math.cos(Math.radians(degrees)))+width/2)+10;
        })
        .attr("y",  function(d, i){
            return (radius * Math.sin(Math.radians(i * incrementAngle)))+height/6+4;
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
            return d3.interpolateRainbow(d.theoryYear/30)})
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
            .style("font-size","10px");
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
                      return d3.interpolateRainbow(d.theoryYear/30)})
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
                  .transition().ease(d3.easeCubic).duration("250").style("font-size","10px");
              text.exit().remove();
         });
}
function handleTheoryMouseOver(d,i){
    if(d3.select("#tt"+d.theoryID).attr("data-clicked") == 0){
        d3.select("#tt"+d.theoryID).transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", "#212121");
        d3.select("#tc"+d.theoryID).transition()
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
            .attr("fill", d3.interpolateRainbow(d.theoryID/30));
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
                .attr("fill", d3.interpolateRainbow(lastSelectedID/30));
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
            });
    }else{
        d3.select("#theorySummary")
            .transition().ease(d3.easeCubic)
            .duration("250").style("opacity", 0).on("end", 
                function(){d3.select("#theorySummary").style("display", "none");});
        text.attr("data-clicked", 0);
        circle.attr("data-clicked", 0);
        circle.transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", d3.interpolateRainbow(d.theoryID/30))
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
            .attr("fill", scaleColour(d.id))
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
            .attr("fill", scaleColour(d.id))
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
            .attr("fill", scaleColour(d.id))
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
        .attr("width", width)
        .attr("height", height)
        .style("pointer-events", "all")
    g = svg.append("g");

    var timeline = g.append("rect")
        .attr("x", 0)
        .attr("y", height/2)
        .attr("width", width)
        .attr("height", 10)
        .attr("fill", "#444444")
        .attr("rx","5")
        .attr("ry","5");

    var antecedentsTimeline = g.append("rect")
        .attr("x", 0)
        .attr("y", (height/5)*4)
        .attr("width", width)
        .attr("height", 10)
        .attr("fill", "#444444")
        .attr("rx","5")
        .attr("ry","5");
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
