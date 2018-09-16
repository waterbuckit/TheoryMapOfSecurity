//Globals
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
var selectedReferentObjects = new Map();
var selectedDimensions = new Map();
var selectedTheories = new Map();
var selectedLogicsMap = new Map();
var lineFunction = d3.line()
                       .x(function(d) { return d.x; })
                       .y(function(d) { return d.y; })
                       .curve(d3.curveMonotoneY);
window.addEventListener("resize", redraw);
$("#keywordsSearchInput").on("input", addKeyword);
$("#list").delegate(".listelement", "click", function(){
     var elemId = $(this).attr('data-id');
     d3.select("#"+elemId).transition()
        .ease(d3.easeCubic)
        .duration("100")
        .style("opacity", 0)
        .remove();
     selectedKeywords.delete(parseInt(elemId.split("kw")[1]));   
     if(document.getElementById("keywordsSwitch").checked){
        getTheoriesFromKeywords();
     }
});
$("#referentObjList").delegate(".listelement", "click", function(){
     var elemId = $(this).attr('data-id');
     d3.select("#"+elemId).transition()
        .ease(d3.easeCubic)
        .duration("100")
        .style("opacity", 0)
        .remove();
     var id = elemId.split("ro")[1];
     selectedReferentObjects.delete(id);   
     
     var circle = d3.select("#roc"+id);
     var text = d3.select("#rot"+id);
    
     text.attr("data-clicked", 0);
     circle.attr("data-clicked", 0);
     circle.transition()
         .ease(d3.easeCubic)
         .duration("250")
         .attr("fill", "#c1c1c1");
     text.transition()
         .ease(d3.easeCubic)
         .duration("250")
         .attr("fill", "#5b5b5b");
     gRelationships.selectAll("#ror"+id).transition()
         .ease(d3.easeCubic)
         .duration("250")
         .style("opacity", 0)
         .remove();
});

function redrawWithParams(w, h){
    width = w;
    height = h;
   
    // redraw timelines at correct width and height
    svg
        .attr("width", width)
        .attr("height", height)
    svg.select("#backgroundrect")
        .attr("width", width)
        .attr("height", height)
    timeline
        .attr("y", height/2)
        .attr("width", width)
    antecedentTimeline
        .attr("y", (height/5)*4)
        .attr("width", width)
    d3.select("#fullscreen")
        .attr("x", width - 50)
        .attr("y", height - 60)
    d3.select("#fullscreenRect")
        .attr("x", width - 50)
        .attr("y", height - 60)
    
    redrawLogicCircle();

    if(!document.getElementById("timelineSwitch").checked){
        var theoryCircles = g.selectAll(".theoryCircle");
        var increment =(width-30)/theoryCircles.size();
        theoryCircles
             .attr("cx", function(d, i){
                 return (i * increment)+30;
             })
             .attr("cy", (height/2)+5);

        g.selectAll(".theoryTitle")
             .attr("x", function(d,i){
                 return (i * increment)+30;
             })
             .attr("y", (height/2)-5)
             .attr("transform", function(d,i) { 
                 return "rotate(-45,"+((i*increment)+30)+","+((height/2)-5)+")"
             });
        redrawReferentObjects();
        redrawRelationships();
    }
}
function redraw(){
    width = document.getElementById('mapContainer').offsetWidth;
    height = document.getElementById('mapContainer').offsetHeight;
   
    // redraw timelines at correct width and height
    svg
        .attr("width", width)
        .attr("height", height)
    svg.select("#backgroundrect")
        .attr("width", width)
        .attr("height", height)
    timeline
        .attr("y", height/2)
        .attr("width", width)
    antecedentTimeline
        .attr("y", (height/5)*4)
        .attr("width", width)

    d3.select("#fullscreen")
        .attr("x", width - 50)
        .attr("y", height - 60)
    d3.select("#fullscreenRect")
        .attr("x", width - 50)
        .attr("y", height - 60)
    
    redrawLogicCircle();

    if(!document.getElementById("timelineSwitch").checked){
        var theoryCircles = g.selectAll(".theoryCircle");
        var increment =(width-30)/theoryCircles.size();
        theoryCircles
             .attr("cx", function(d, i){
                 return (i * increment)+30;
             })
             .attr("cy", (height/2)+5);

        g.selectAll(".theoryTitle")
             .attr("x", function(d,i){
                 return (i * increment)+30;
             })
             .attr("y", (height/2)-5)
             .attr("transform", function(d,i) { 
                 return "rotate(-45,"+((i*increment)+30)+","+((height/2)-5)+")"
             });
        redrawReferentObjects();
        redrawRelationships();
    }
}
function redrawRelationships(){
    var relationships = gRelationships.selectAll(".relationships")
    if(document.getElementById("relationshipsSwitch").checked){
        relationships
            .attr("d", function(d){
                var logicCircle = g.select("#c"+d.logicID);
                return lineFunction([{"x": logicCircle.attr("cx"), "y" : logicCircle. attr("cy")},
                    {"x" : logicCircle.attr("cx"), "y" : (height/6)*2},
                    {"x" : g.select("#tc"+d.theoryID).attr("cx") , "y" : timeline.attr("y")-10},
                    {"x" : g.select("#tc"+d.theoryID).attr("cx") , "y" : timeline.attr("y")}])
            });
    }else{
        relationships.each(function(d){
            var relationship = d3.select(this); 
            if(relationship.attr("id").startsWith("ror")){
                var theoryRelatedTo = g.select("#tc"+relationship.attr("data-theoryid"));
                relationship
                    .attr("d", function(d){ return lineFunction([{"x": theoryRelatedTo.attr("cx"), "y" : theoryRelatedTo.attr("cy")},
                            {"x" : theoryRelatedTo.attr("cx"), "y" : (height/3)*2},
                            {"x" : g.select("#roc"+d.theorySecurityReferentObject).attr("cx") , "y" : antecedentTimeline.attr("y")-10},
                            {"x" : g.select("#roc"+d.theorySecurityReferentObject).attr("cx") , "y" : antecedentTimeline.attr("y")}])
                    })
            }else{
                var logicCircle = g.select("#c"+d.logicID);
                relationship
                    .attr("d", function(d){
                        var logicCircle = g.select("#c"+d.logicID);
                        return lineFunction([{"x": logicCircle.attr("cx"), "y" : logicCircle. attr("cy")},
                            {"x" : logicCircle.attr("cx"), "y" : (height/6)*2},
                            {"x" : g.select("#tc"+d.theoryID).attr("cx") , "y" : timeline.attr("y")-10},
                            {"x" : g.select("#tc"+d.theoryID).attr("cx") , "y" : timeline.attr("y")}])
                    });
            }
        });
    }
}
function redrawReferentObjects(){
    var refObCircles = g.selectAll(".referentObjectCircle");
    var increment =(width-30)/refObCircles.size();
    refObCircles
         .attr("cx", function(d, i){
             return (i * increment)+30;
         })
         .attr("cy", function(){ return (parseInt(antecedentTimeline.attr("y"))+5)})

    g.selectAll(".referentObjectTitle")
         .attr("x", function(d,i){
             return (i * increment)+30;
         })
         .attr("y", parseInt(antecedentTimeline.attr("y"))-5)
         .attr("transform", function(d,i) { 
             return "rotate(-45,"+((i*increment)+30)+","+(parseInt(antecedentTimeline.attr("y"))-5)+")"
         })
}
function redrawLogicCircle(){
    var logicCircles = g.selectAll(".logicCircle");
    
    var radius = (height/5)*0.4;

    var incrementAngle = 360/logicCircles.size();
    logicCircles
        .attr("cx", function(d, i){
            return (radius * Math.cos(Math.radians(i * incrementAngle-18)))+width/2;
        })
        .attr("cy", function(d, i){
            return (radius * Math.sin(Math.radians(i * incrementAngle-18)))+height/6;
        })
    
    var fontSize = 16;

    g.selectAll(".logicCircleName")
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
}
$("#dimensionsSelected").delegate(".listelement", "click", function(){
     var elemId = $(this).attr('data-id');
     d3.select("#"+elemId).transition()
        .ease(d3.easeCubic)
        .duration("100")
        .style("opacity", 0)
        .remove();
     selectedDimensions.delete(elemId.split("dim")[1]);   
     if(d3.select("#theoryInfoMore").style("display") != "none"){
         $.post("gettheorydata", {id : lastSelectedID},
             function(data, status){
                 if(selectedDimensions.size == 0){
                     showTheoryData(data, true);   
                 }
                 else{
                     showTheoryData(data, false); 
                 }
             });
     }

});
renderSVG();
getLogicIDs();
getTheories();
getReferentObjects();
function getTheories(){
   $.get("gettheories", function(data, status){
       var increment =(width-30)/data.length;
       g.selectAll(".theoryCircle")
            .data(data, function(d){ d.theoryID})
            .enter()
            .append("circle")
            .attr("id", function(d){ return "tc"+d.theoryID})
            .attr("class", "theoryCircle")
            .attr("cx", function(d, i){
                return (i * increment)+30;
            })
            .attr("cy", (height/2)+5)
            .attr("r", 7)
            .attr("fill", "#c1c1c1")
            .attr("data-selected", 0)
            .on("mouseover", handleTheoryMouseOver)
            .on("mouseout", handleTheoryMouseOut)
            .on("click", handleTheoryClick)

       g.selectAll(".theoryTitle")
            .data(data, function(d) { d.theoryID})
            .enter()
            .append("text")
            .attr("class", "theoryTitle")
            .attr("data-clicked", 0)
            .attr("id", function(d){ return "tt"+d.theoryID})
            .attr("x", function(d,i){
                return (i * increment)+30;
            })
            .attr("y", (height/2)-5)
            .attr("transform", function(d,i) { 
                return "rotate(-45,"+((i*increment)+30)+","+((height/2)-5)+")"
            })
            .text(function(d){ return d.theoryName})
            .style("font-size", "1px")
            .style("font-family", "'Oswald', sans-serif")
            .attr("fill", "#5b5b5b")
            .on("mouseover", handleTheoryMouseOver)
            .on("mouseout", handleTheoryMouseOut)
            .on("click", handleTheoryClick)
            .transition()
                .ease(d3.easeCubic)
                .duration("1200")
                .style("font-size","12px");
        $.get("getPosNegAll",
            function(data, status){
                for(datum of data){
                    g.select("#tc"+datum.theoryID)
                        .attr("data-posneg",function(){
                            return datum.logicsPositiveSecurity == 1 ? "#98e29a" : "#e08888"
                        });
                   // gRelationships.selectAll("#r"+datum.theoryID)
                   //     .transition().ease(d3.easeCubic).duration("250")
                   //     .attr("stroke",function(){
                   //         return datum.logicsPositiveSecurity == 1 ? "#98e29a" : "#e08888"
                   //     });
                }
            });
   });
}
function addSelectedDimension(){
    var e = document.getElementById("dimensionsSelection");
    if(!selectedDimensions.has(e.options[e.selectedIndex].value)){
        var id = e.options[e.selectedIndex].value;
        var val = e.options[e.selectedIndex].text;
        $('#dimensionsSelected').append('<li id="'+"dim"+id+'" class="listIn"><input type="button" data-id="'+"dim"+id+'" class="listelement" value="X" /> '+val+'<input type="hidden" name="listed[]" value="'+val+'"></li>');
        selectedDimensions.set(e.options[e.selectedIndex].value, e.options[e.selectedIndex].text);
        if(d3.select("#theoryInfoMore").style("display") != "none"){
            $.post("gettheorydata", {id : lastSelectedID},
                function(data, status){
                    if(selectedDimensions.size == 0){
                        showTheoryData(data, true);   
                    }
                    else{
                        showTheoryData(data, false); 
                    }
                });
        }
    }
}
function addSelectedRefOb(){
    var e = document.getElementById("referentObjectsSelection");
    if(!selectedReferentObjects.has(e.options[e.selectedIndex].value)){
        var id = e.options[e.selectedIndex].value;
        var val = e.options[e.selectedIndex].text;
        $('#referentObjList').append('<li id="'+"ro"+id+'" class="listIn"><input type="button" data-id="'+"ro"+id+'" class="listelement" value="X" /> '+val+'<input type="hidden" name="listed[]" value="'+val+'"></li>');
        selectedReferentObjects.set(e.options[e.selectedIndex].value, e.options[e.selectedIndex].text);
         
        var circle = d3.select("#roc"+id);
        var text = d3.select("#rot"+id);
        text.attr("data-clicked", 1);
        circle.attr("data-clicked", 1);
        text.transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", "#212121");
        circle.transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill","#f2f2f2"); 
        $.post("getRelationshipToTheories",
            {id : id},
            function(data, status){
                showRelationshipToTheory(data, id); 
            });
    }
}
function getReferentObjects(){
    $.get("getreferentobjects", function(data, status){
        var increment =(width-30)/data.length;
        g.selectAll(".referentObjectCircle")
             .data(data, function(d){ d.id})
             .enter()
             .append("circle")
             .attr("id", function(d){ return "roc"+d.id})
             .attr("class", "referentObjectCircle")
             .attr("cx", function(d, i){
                 return (i * increment)+30;
             })
             .attr("cy", function(){ return (parseInt(antecedentTimeline.attr("y"))+5)})
             .attr("r", 7)
             .attr("fill", "#c1c1c1")
             .attr("data-selected", 0)
             .on("mouseover", handleReferentObjectMouseOver)
             .on("mouseout", handleReferentObjectMouseOut)
             .on("click", handleReferentObjectClick);

        g.selectAll(".referentObjectTitle")
             .data(data, function(d) { d.id})
             .enter()
             .append("text")
             .attr("class", "referentObjectTitle")
             .attr("data-clicked", 0)
             .attr("id", function(d){ return "rot"+d.id})
             .attr("x", function(d,i){
                 return (i * increment)+30;
             })
             .attr("y", parseInt(antecedentTimeline.attr("y"))-5)
             .attr("transform", function(d,i) { 
                 return "rotate(-45,"+((i*increment)+30)+","+(parseInt(antecedentTimeline.attr("y"))-5)+")"
             })
             .text(function(d){ return d.referentObject.length > 25 ? d.referentObject.substring(0,25)+"..." : d.referentObject})
             .style("font-size", "1px")
             .style("font-family", "'Oswald', sans-serif")
             .attr("fill", "#5b5b5b")
             .on("mouseover", handleReferentObjectMouseOver)
             .on("mouseout", handleReferentObjectMouseOut)
             .on("click", handleReferentObjectClick)
             .transition()
                 .ease(d3.easeCubic)
                 .duration("1200")
                 .style("font-size","12px");
        for(datum of data){
            $('#referentObjectsSelection').append($('<option>', {
                value: datum.id,
                text: datum.referentObject
            }));
        }
    });
}
function handleReferentObjectMouseOver(d, i){
    if(d3.select("#rot"+d.id).attr("data-clicked") == 0){
            d3.select("#rot"+d.id).transition()
                .ease(d3.easeCubic)
                .duration("250")
                .attr("fill", "#212121");
            d3.select("#roc"+d.id)
                .transition()
                .ease(d3.easeCubic)
                .duration("250")
                .attr("fill", "#f2f2f2");
    }
}
function handleReferentObjectMouseOut(d, i){
    if(d3.select("#rot"+d.id).attr("data-clicked") != 1){
        d3.select("#rot"+d.id).transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", "#5b5b5b");
        d3.select("#roc"+d.id).transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", function(){
                 return (g.select("#roc"+d.id).attr("data-selected") == 0 ? "#c1c1c1" : d3.interpolateRainbow(d.id/21));
            });
    }
}
function handleReferentObjectClick(d, i){
    var circle = d3.select("#roc"+d.id);
    var text = d3.select("#rot"+d.id);
    if(circle.attr("data-clicked") == 0 || text.attr("data-clicked") == 0){
        if(lastSelectedID != null){
           d3.select("#rot"+lastSelectedID).transition()
                .ease(d3.easeCubic)
                .duration("250")
                .attr("fill","#5b5b5b");
           d3.select("#roc"+lastSelectedID)
                .transition()
                .ease(d3.easeCubic)
                .duration("250")
                .attr("fill", "#c1c1c1");
        }    
        text.attr("data-clicked", 1);
        circle.attr("data-clicked", 1);
        lastSelectedID = d.id;  
        text.transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", "#212121");
        circle.transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill","#f2f2f2"); 
        $.post("getRelationshipToTheories",
            {id : d.id},
            function(data, status){
                showRelationshipToTheory(data, d.id); 
            });
        // Add to list
        
        $('#referentObjList').append('<li id="'+"ro"+d.id+'" class="listIn"><input type="button" data-id="'+"ro"+d.id+'" class="listelement" value="X" /> '+d.referentObject+'<input type="hidden" name="listed[]" value="'+d.referentObject+'"></li>');
        selectedReferentObjects.set(d.id, d.referentObject);
        
    }else{
        text.attr("data-clicked", 0);
        circle.attr("data-clicked", 0);
        circle.transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", "#c1c1c1");
        text.transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", "#5b5b5b");
        gRelationships.selectAll("#ror"+d.id).each(function(d){
            var relationship = d3.select(this);
            if(!selectedTheories.has(parseInt(relationship.attr("data-theoryid")))){
                relationship
                    .transition()
                    .ease(d3.easeCubic)
                    .duration("250")
                    .style("opacity", 0)
                    .remove();
            }
        });
        selectedReferentObjects.delete(d.id);
        d3.select("#ro"+d.id).transition()
            .ease(d3.easeCubic)
            .duration("100")
            .style("opacity", 0)
            .remove();
    }
}
function showRelationshipToTheory(data, id){
    if(data.length == 0){
        return;
    }
    if(document.getElementById("relationshipsSwitch").checked){
        gRelationships.selectAll(".relationships").transition()
            .ease(d3.easeCubic)
            .duration("250")
            .style("opacity", 0)
            .remove();
    }
    $("#relationshipsSwitch").prop("checked", false);
    for(datum of data){
        theoryRelatedTo = g.select("#tc"+datum.theoryID);
        gRelationships.append("path")
            .datum(datum, datum.theoryID)
            .attr("d", function(d){ return lineFunction([{"x": theoryRelatedTo.attr("cx"), "y" : theoryRelatedTo.attr("cy")},
                {"x" : theoryRelatedTo.attr("cx"), "y" : (height/3)*2},
                {"x" : g.select("#roc"+id).attr("cx") , "y" : antecedentTimeline.attr("y")-10},
                {"x" : g.select("#roc"+id).attr("cx") , "y" : antecedentTimeline.attr("y")}])
        })
        .attr("stroke", function(d){
            return document.getElementById("posNegSwitch").checked == true ? 
                d3.select("#tc"+d.theoryID).attr("data-posneg") : d3.interpolateRainbow(d.theoryGroupIndex/13);
        })
        .attr("class", "relationships")
        .attr("id", function(d) { return "ror"+id})
        .attr("data-theoryid", datum.theoryID)
        .attr("stroke-width", 2)
        .attr("fill", "none")
        .style("opacity", 0)
        .transition().ease(d3.easeCubic).duration("250").style("opacity",1);
    }
}
function switchToTimeline(){

}
function addKeyword(){
    var val = $(this).val();
    if($('#relatedKeywords').find('option').filter(function(){
        return this.value.toUpperCase() === val.toUpperCase();        
    }).length) {
       var id = $("#relatedKeywords [value='"+val+"']").data("id"); 
       if(!selectedKeywords.has(id)){
           selectedKeywords.set(id, val);
           $('#list').append('<li id="'+"kw"+id+'" class="listIn"><input type="button" data-id="'+"kw"+id+'" class="listelement" value="X" /> '+val+'<input type="hidden" name="listed[]" value="'+val+'"></li>');
           getTheoriesFromKeywords(); 
       }
    }
}
function getTheoriesFromKeywords(){
    if(document.getElementById("timelineSwitch").checked){
        $.post("gettheoriesbykeywordsTimeline", 
            { keywords : Array.from(selectedKeywords.keys()) , logicIds : selectedLogics},
            update);
    }else{
        $.post("gettheoriesbykeywords", 
            { keywords : Array.from(selectedKeywords.keys()) , logicIds : selectedLogics},
            updateMap);
    }
}
function keywordsSwitch(){
    if(document.getElementById("keywordsSwitch").checked){
        $("#keywordsSearchInput").prop("disabled", false);
        getTheoriesFromKeywords();
    }else{ 
        $("#keywordsSearchInput").prop("disabled", true);
        if(document.getElementById("timelineSwitch").checked){
            $.post("gettheoriesbylogicsTimeline", { ids : selectedLogics },
            update);
        }else{
            $.post("gettheoriesbylogics", { ids : selectedLogics },
            updateMap);
        }
    }
}
function getPosNeg(){
    if(document.getElementById("timelineSwitch").checked){
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
    }else{
        var ids = [];
        for(datum of g.selectAll(".theoryCircle").data()){
            if(g.select("#tc"+datum.theoryID).attr("data-selected") == 1 || g.select("#tc"+datum.theoryID).attr("data-clicked") == 1){
                ids.push(datum.theoryID);
            }
        }
        if(document.getElementById("posNegSwitch").checked){
            var wasEmpty = false;
            if(selectedLogics.length == 0){
                wasEmpty = true;
                addAllLogics();
            }
            $.post("getPosNeg", { ids : ids, logicIds : selectedLogics },
                    function(data, status){
                        for(datum of data){
                            g.select("#tc"+datum.theoryID)
                                .attr("data-posneg",function(){
                                    return datum.logicsPositiveSecurity == 1 ? "#98e29a" : "#e08888"
                                }).transition()
                                .ease(d3.easeCubic)
                                .duration("250").attr("fill",function(){
                                    return datum.logicsPositiveSecurity == 1 ? "#98e29a" : "#e08888"
                                })
                            gRelationships.selectAll("#r"+datum.theoryID)
                                .transition().ease(d3.easeCubic).duration("250")
                                .attr("stroke",function(){
                                    return datum.logicsPositiveSecurity == 1 ? "#98e29a" : "#e08888"
                                });
                        }
                    });
            if(wasEmpty){
                selectedLogics = [];
            }
        }else{
            for(circle of ids){
                g.select("#tc"+circle)
                    .transition()
                    .ease(d3.easeCubic)
                    .duration("250")
                    .attr("fill", function(d){
                        return d3.interpolateRainbow(d.theoryGroupIndex/13);
                    });
                gRelationships.selectAll("#r"+circle)
                    .transition()
                    .ease(d3.easeCubic)
                    .duration("250")
                    .attr("stroke", function(d){
                        return d3.interpolateRainbow(d.theoryGroupIndex/13);
                    });
            }
        }
    }
}
function addAllLogics(){
    for(datum of g.selectAll(".logicCircle").data()){
        selectedLogics.push(datum.id);
    }
}
function getRelationships(){
    if((selectedLogics.length == 0 && document.getElementById("relationshipsSwitch").checked)|| (document.getElementById("keywordsSwitch").checked == true && selectedKeywords.size == 0)){
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
    if(document.getElementById("timelineSwitch").checked){
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
                    if(data.length == 0) { 
                        gRelationships.selectAll(".relationships")
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
    }else{ 
        if(g.selectAll(".theoryCircle").data().length == 0){
            return;
        }
        var ids = [];
        for(datum of g.selectAll(".theoryCircle").data()){
            if(g.select("#tc"+datum.theoryID).attr("data-selected") == 1){
                ids.push(datum.theoryID);
            }
        }
        if(document.getElementById("relationshipsSwitch").checked == true){
            $.post("getRelationships", { ids : ids, logicIds : selectedLogics},
                function(data, status){
                    if(data.length == 0) { 
                        gRelationships.selectAll(".relationships")
                            .transition()
                            .ease(d3.easeCubic)
                            .duration("250")
                            .style("opacity",0)
                            .remove();       
                        return
                    } 
                    var relationships = gRelationships.selectAll(".relationships")
                        .data(data)
                    relationships.enter().append("path")
                        .merge(relationships)
                        .attr("d", function(d){
                            var logicCircle = g.select("#c"+d.logicID);
                            return lineFunction([{"x": logicCircle.attr("cx"), "y" : logicCircle. attr("cy")},
                                {"x" : logicCircle.attr("cx"), "y" : (height/6)*2},
                                {"x" : g.select("#tc"+d.theoryID).attr("cx") , "y" : timeline.attr("y")-10},
                                {"x" : g.select("#tc"+d.theoryID).attr("cx") , "y" : timeline.attr("y")}])
                        })
                        .attr("stroke", function(d){
                            return document.getElementById("posNegSwitch").checked == true ? 
                                d3.select("#tc"+d.theoryID).attr("data-posneg") : d3.interpolateRainbow(d.theoryGroupIndex/13);
                        })
                        .attr("class", "relationships")
                        .attr("id", function(d) { return "r"+d.theoryID})
                        .attr("stroke-width", 2)
                        .attr("fill", "none")
                        .style("opacity", 0)
                        .transition().ease(d3.easeCubic).duration("250").style("opacity",1);
                    relationships.exit().remove();
                });
        }else{
            gRelationships.selectAll(".relationships")
                .transition()
                .ease(d3.easeCubic)
                .duration("250")
                .style("opacity",0)
                .remove();        
        }
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
    var radius = (height/5)*0.4;

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
function updateMap(data, status){
    if(data.length == 0){
        g.selectAll(".theoryCircle")
            .attr("data-selected", 0)
            .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", "#c1c1c1");    
        g.selectAll(".theoryTitles").transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", "#5b5b5b")
        getRelationships();
        return;
    }                                    
    var timelineCircle = g.selectAll(".theoryCircle")
        .data(data, function(d) { return d.theoryID });
    timelineCircle.enter()
        .merge(timelineCircle)
        .attr("data-selected", 1)
    if(!document.getElementById("posNegSwitch").checked){
        timelineCircle.transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", function(d){
                return d3.interpolateRainbow(d.theoryGroupIndex/13)
            });
    }else{
        timelineCircle.transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", function(d){
                return d3.select("#tc"+d.theoryID).attr("data-posneg");
            });
    }
    timelineCircle.exit()
        .attr("data-selected", 0)
        .transition()
        .ease(d3.easeCubic)
        .duration("250")
        .attr("fill", "#c1c1c1");
    getRelationships();
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
    if(document.getElementById("keywordsSwitch").checked == true){
    $.post("gettheoriesbykeywordsantecedents", 
        { keywords : Array.from(selectedKeywords.keys()) , logicIds : selectedLogics},
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
    }else{    
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
        if(!document.getElementById("timelineSwitch").checked){ 
            d3.select("#tc"+d.theoryID).transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", function(){
                 return document.getElementById("posNegSwitch").checked == true 
                    && d3.select("#tc"+d.theoryID).attr("data-posneg") != null && d3.select("#tc"+d.theoryID).attr("data-selected") == 1 ? 
                    d3.select("#tc"+d.theoryID).attr("data-posneg") : (g.select("#tc"+d.theoryID).attr("data-selected") == 0 ? "#c1c1c1" : d3.interpolateRainbow(d.theoryGroupIndex/13));
            });
        } else{  
        d3.select("#tc"+d.theoryID).transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", function(){
                 return document.getElementById("posNegSwitch").checked ? 
                    d3.select("#tc"+d.theoryID).attr("data-posneg") : d3.interpolateRainbow(d.theoryID/30);
            });
        }
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
                    return document.getElementById("posNegSwitch").checked &&
                        (d3.select("#tc"+lastSelectedID).attr("data-clicked") == 1 || d3.select("#tc"+lastSelectedID).attr("data-selected") == 1) ? 
                        d3.select("#tc"+lastSelectedID).attr("data-posneg") : document.getElementById("timelineSwitch").checked ? d3.interpolateRainbow(d.theoryID/30) : 
                        d3.select("#tc"+lastSelectedID).attr("data-clicked") == 1 || d3.select("#tc"+lastSelectedID).attr("data-selected") == 1 ? d3.interpolateRainbow(d3.select("#tc"+lastSelectedID).datum().theoryGroupIndex/13) : "#c1c1c1";
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
        selectedTheories.set(d.theoryID, d.theoryName);
        $.post("gettheorydata", {id : d.theoryID},
            function(data, status){
                if(selectedDimensions.size == 0){
                    showTheoryData(data, true);   
                }
                else{
                    showTheoryData(data, false); 
                }
            });
        //$.post("gettheorysummary",
        //    { id : d.theoryID }, 
        //    function(data, status){
        //        if(circle.attr("class") == "antecedentTimelineCircle"){
        //            d3.select("#antecedentTheorySummary")
        //                .style("display", "block")
        //                .transition()
        //                .ease(d3.easeCubic)
        //                .duration("250")
        //                .style("opacity", 1.0);
        //            d3.select("#antecedentTheorySummaryTitle")
        //                .text(d.theoryName);
        //            d3.select("#antecedentTheorySummaryContent")
        //                .text(data.theorySummary);
        //        }else{
        //            d3.select("#theorySummary")
        //                .style("display", "block")
        //                .transition()
        //                .ease(d3.easeCubic)
        //                .duration("250")
        //                .style("opacity", 1.0);
        //            d3.select("#theorySummaryTitle")
        //                .text(d.theoryName);
        //            d3.select("#theorySummaryContent")
        //                .text(data.theorySummary);
        //        }
        //    });
        $.post("getRelationship",
            {id : d.theoryID},
            function(data, status){
                showRelationship(data, d.theoryID); 
            });
    }else{
        //if(circle.attr("class") == "antecedentTimelineCircle"){
        //    d3.select("#antecedentTheorySummary")
        //        .transition().ease(d3.easeCubic)
        //        .duration("250").style("opacity", 0).on("end", 
        //            function(){d3.select("#antecedentTheorySummary").style("display", "none");});
        //}else{
        //    d3.select("#theorySummary")
        //        .transition().ease(d3.easeCubic)
        //        .duration("250").style("opacity", 0).on("end", 
        //            function(){d3.select("#theorySummary").style("display", "none");});
        //}
        text.attr("data-clicked", 0);
        circle.attr("data-clicked", 0);
        circle.transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", function(){
                return document.getElementById("posNegSwitch").checked 
                    && (d3.select("#tc"+d.theoryID).attr("data-clicked") == 1 || d3.select("#tc"+d.theoryID).attr("data-selected") == 1)? 
                    d3.select("#tc"+d.theoryID).attr("data-posneg") : document.getElementById("timelineSwitch").checked == true ? d3.interpolateRainbow(d.theoryID/30) : (d3.select("#tc"+d.theoryID).attr("data-clicked") == 1 || d3.select("#tc"+d.theoryID).attr("data-selected") == 1) ? d3.interpolateRainbow(d.theoryGroupIndex/13): "#c1c1c1";
            });
        text.transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", "#5b5b5b");
        gRelationships.selectAll("#r"+d.theoryID).transition()
            .ease(d3.easeCubic)
            .duration("250")
            .style("opacity", 0)
            .remove();
        selectedTheories.delete(d.theoryID);
        var theoryID = d.theoryID;
        var refObs = gRelationships.selectAll("#ror"+d.theorySecurityReferentObject);
        var refObID = d.theorySecurityReferentObject;
        refObs.each(function(d){
            if(d3.select(this).attr("data-theoryid") == theoryID){
                d3.select(this)            
                    .transition()
                    .ease(d3.easeCubic)
                    .duration("250")
                    .style("opacity", 0)
                    .remove().on("end", function(){
                        if(gRelationships.selectAll("#ror"+refObID).size() == 0){
                            d3.select("#ro"+refObID).transition()
                               .ease(d3.easeCubic)
                               .duration("100")
                               .style("opacity", 0)
                               .remove();
                            selectedReferentObjects.delete(refObID);   
                        }
                    });
            }
        });
        d3.select("#theoryInfoMore")
            .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .style("opacity", 0);
        setTimeout(function(){d3.select("#theoryInfoMore")
            .style("display", "none");},250);
    }
}
function hideDims(){
    if(!selectedDimensions.has("exemp")){
        d3.select("#theoryExampleButton").style("display", "none");
    }
    if(!selectedDimensions.has("aaotis")){
        d3.select("#theoryStructureOfTheInternationalSystemButton").style("display", "none");
    }
    if(!selectedDimensions.has("aroste")){
        d3.select("#theoryRelationOfSystemToEnvironmentButton").style("display", "none");
    }
    if(!selectedDimensions.has("aaos")){
        d3.select("#theoryAgentButton").style("display","none");
    }
    if(!selectedDimensions.has("tta")){
        d3.select("#theoryThreatActorsButton").style("display", "none");
    }
    if(!selectedDimensions.has("ppsor")){
        d3.select("#theorySourceOfResilienceButton").style("display", "none");
    }
    if(!selectedDimensions.has("ti")){
        d3.select("#theoryInterventionsButton").style("display", "none");
    }
    if(!selectedDimensions.has("ts")){
        d3.select("#theoryStrategyButton").style("display", "none");
    }
    if(!selectedDimensions.has("at")){
        d3.select("#logicsTechnologyButton").style("display", "none");
    }
    if(!selectedDimensions.has("ap")){
        d3.select("#logicsPoliticsButton").style("display", "none");
    }
    if(!selectedDimensions.has("opp")){
        d3.select("#logicsOppositesButton").style("display", "none"); 
    }
    if(!selectedDimensions.has("close")){
        d3.select("#logicsCloselyRelatedButton").style("display", "none");
    }
}
function showTheoryData(data, more){
    d3.select("#logicInfo").style("display", "none"); 

    $("#theoryInfoMore").children().css("display", "block");
    d3.select("#theoryTitleButton")
        .text(data.theoryName + " - " + data.theoryYear)
        .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .style("background", d3.interpolateRainbow(data.theoryGroupIndex/13));
    d3.select("#theorySummary")
        .text(data.theorySummary);
    d3.select("#theoryPrinciples")
        .text(data.theoryPrinciples);
    d3.select("#theoryExample")
        .text(data.theoryExample);
    d3.select("#theoryStructureOfTheInternationalSystem")
        .text(data.theoryStructureOfTheInternationalSystem);
    d3.select("#theoryRelationOfSystemToEnvironment")
        .text(data.theoryRelationOfSystemToEnvironment);
    d3.select("#theoryAgent")
        .text(data.theoryAgent);
    d3.select("#theoryThreatActors")
        .text(data.theoryThreatActors);
    d3.select("#theorySourceOfResilience")
        .text(data.theorySourceOfResilience);
    d3.select("#theoryInterventions")
        .text(data.theoryInterventions);
    d3.select("#theoryStrategy")
        .text(data.theoryStrategy);
    d3.select("#theoryPrimaryAuthors")
        .text(data.theoryPrimaryAuthors);
    d3.select("#theoryLimitations")
        .text(data.theoryLimitations);
    d3.select("#theoryResearchDrawnUpon")
        .text(data.theoryResearchDrawnUpon);
    $.post("getlogicinfofromtheory", {id : lastSelectedID},
        function(data, status){
            var politics = d3.select("#logicsPolitics").text("");
            var tech = d3.select("#logicsTechnology").text("");
            var opp = d3.select("#logicsOpposites").text("");
            var related = d3.select("#logicsCloselyRelated").text("");
            for(datum of data){
                politics.text(politics.text() + datum.logicsName + "\n" + datum.logicsPolitics + "\n\n");
                tech.text(tech.text() + datum.logicsName + "\n" + datum.logicsTechnology + "\n\n");
                opp.text(opp.text() + datum.logicsName + "\n" + datum.logicsOpposite + "\n\n");
                related.text(related.text() + datum.logicsName + "\n" + datum.logicsCloselyRelated + "\n\n");
            }
        });
    if(!more){
        hideDims();
    } 
    d3.select("#theoryInfoMore")
        .style("display", "block")
        .transition()
        .ease(d3.easeCubic)
        .duration("250")
        .style("opacity", 1.0);
}

function showRelationship(data, id){
    if(data.length == 0){
        return;
    }
    if(document.getElementById("relationshipsSwitch").checked){
        gRelationships.selectAll(".relationships").transition()
            .ease(d3.easeCubic)
            .duration("250")
            .style("opacity", 0)
            .remove();
    }
    $("#relationshipsSwitch").prop("checked", false);
    for(datum of data){
        gRelationships.append("path").datum(datum, datum.theoryID)
            .attr("d", function(d){
                var logicCircle = g.select("#c"+d.logicID);
                return lineFunction([{"x": logicCircle.attr("cx"), "y" : logicCircle. attr("cy")},
                {"x" : logicCircle.attr("cx"), "y" : (height/6)*2},
                {"x" : g.select("#tc"+d.theoryID).attr("cx") , "y" : timeline.attr("y")-10},
                {"x" : g.select("#tc"+d.theoryID).attr("cx") , "y" : timeline.attr("y")}])
            })
            .attr("stroke", function(d){
                return document.getElementById("posNegSwitch").checked == true ? 
                    d3.select("#tc"+d.theoryID).attr("data-posneg") : d3.interpolateRainbow(d.theoryGroupIndex/13);
            })
            .attr("class", "relationships")
            .attr("id", function(d) { return "r"+d.theoryID})
            .attr("stroke-width", 2)
            .attr("fill", "none")
            .style("opacity", 0)
            .transition()
                .ease(d3.easeCubic)
                .duration("250")
                .style("opacity",1);
    }
    var theoryRelatedTo = g.select("#tc"+id);
    gRelationships.append("path")
        .datum(data[0], id)
        .attr("d", function(d){ return lineFunction([{"x": theoryRelatedTo.attr("cx"), "y" : theoryRelatedTo.attr("cy")},
            {"x" : theoryRelatedTo.attr("cx"), "y" : (height/3)*2},
            {"x" : g.select("#roc"+d.theorySecurityReferentObject).attr("cx") , "y" : antecedentTimeline.attr("y")-10},
            {"x" : g.select("#roc"+d.theorySecurityReferentObject).attr("cx") , "y" : antecedentTimeline.attr("y")}])
    })
    .attr("stroke", function(d){
        return document.getElementById("posNegSwitch").checked == true ? 
            d3.select("#tc"+d.theoryID).attr("data-posneg") : d3.interpolateRainbow(d.theoryGroupIndex/13);
    })
    .attr("class", "relationships")
    .attr("id", function(d) { return "ror"+d.theorySecurityReferentObject})
    .attr("data-theoryid", function(d) { 
        return d.theoryID })
    .attr("stroke-width", 2)
    .attr("fill", "none")
    .style("opacity", 0)
    .transition().ease(d3.easeCubic).duration("250").style("opacity",1);
}
function selectLogicAndShow(d,i){
    var circle = d3.select("#c"+d.id);
    var text = d3.select("#t"+d.id); 
    if(circle.attr("data-clicked") == 0 || text.attr("data-clicked") == 0){
        $.post("getlogicbyid",
            { id : d.id }, 
            function(data, status){
                selectedLogics.push(d.id);
                selectedLogicsMap.set(d.id, d.logicsName); 
                
                showLogicData(data);

                if(document.getElementById("keywordsSwitch").checked == true){
                    getTheoriesFromKeywords();
                }else{
                    if(document.getElementById("timelineSwitch").checked == true){
                    $.post("gettheoriesbylogicsTimeline", { ids : selectedLogics },
                        update);
                    }else{
                        $.post("gettheoriesbylogics", { ids : selectedLogics },
                            updateMap);
                    }
                    if(d3.select("#fullscreen").attr("data-selected") == 1){
                        updateVennDiagram(); 
                    }
                }
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
        d3.select("#logicInfo").transition()
            .ease(d3.easeCubic)
            .duration("250")
            .style("opacity", 0.0)
            .on("end", function(){
                d3.select("#logicInfo")
                    .style("display", "none");
            });
        //d3.select("#logicSummary")
        //    .transition().ease(d3.easeCubic)
        //    .duration("250").style("opacity", 0).on("end", 
        //        function(){d3.select("#logicSummary").style("display", "none");});
        //d3.select("#theorySummary")
        //    .transition().ease(d3.easeCubic)
        //    .duration("250").style("opacity", 0).on("end", 
        //        function(){d3.select("#theorySummary").style("display", "none");});
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
        selectedLogicsMap.delete(d.id); 
        selectedLogics.splice(selectedLogics.findIndex(function(id){ return id == d.id }),1);
        if(document.getElementById("keywordsSwitch").checked == true){
            getTheoriesFromKeywords();
        }else{ 
            if(document.getElementById("timelineSwitch").checked == true){
                $.post("gettheoriesbylogicsTimeline", { ids : selectedLogics },
                    update);
            }else{
                $.post("gettheoriesbylogics", { ids : selectedLogics },
                    updateMap);
                if(d3.select("#fullscreen").attr("data-selected") == 1){
                    if(selectedLogics.length > 0){
                        updateVennDiagram(); 
                    }else{
                        d3.select("#venn").transition()
                            .ease(d3.easeCubic)
                            .duration("250")
                            .style("opacity", 0);
                    }
                }
            }
        }
    }
}

function showLogicData(data){
    // hide the theory div
    d3.select("#theoryInfoMore").style("display", "none"); 
     
    d3.select("#logicTitleButton")
        .text(data.logicsName)
            .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .style("background", function(){
                return data.logicsPositiveSecurity == 1 ? "#98e29a" : "#e08888";
            });
    d3.select("#logicsSummary")
        .text(data.logicsSummary);
    d3.select("#logicsCommentary")
        .text(data.logicsCommentary);
    d3.select("#logicsObjects")
        .text(data.logicsObjects);
    d3.select("#logicsMainPolitics")
        .text(data.logicsPolitics);
    d3.select("#logicsMainTechnology")
        .text(data.logicsTechnology);
    d3.select("#logicsMainOpposingLogics")
        .text(data.logicsOppositeLogic);
    d3.select("#logicsMainCloselyRelated")
        .text(data.logicsCloselyRelated);
    d3.select("#logicsExemplars")
        .text(data.logicsExemplars);
    d3.select("#logicsReferences")
        .text(data.logicsReferences);
    d3.select("#logicInfo")
        .style("display", "block")
        .transition()
        .ease(d3.easeCubic)
        .duration("250")
        .style("opacity", 1.0);
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
        .style("pointer-events", "none")
    svg.append("rect")
        .attr("fill", "#ffffff")
        .attr("id", "backgroundrect")
        .attr("width", width)
        .attr("height", height)
        .attr("x", 0)
        .attr("y", 0);
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
    d3.select('#saveButton').on('click', function(){
    	var svgString = getSVGString(svg.node());
    	svgString2Image( svgString, width, height, 'png', save ); // passes Blob and filesize String to the callback
    
    	function save(pngData){    
            var doc = new jsPDF({
                orientation : "l",
                unit: "mm",
                format: "a3"
            });
            doc.addImage(pngData, 'PNG', 10,10);
            doc.save('map.pdf');
        }
    });
    
    var rectBox = g.append("rect")
        .attr("id", "fullscreen")
        .attr("x", width - 50)
        .attr("y", height - 60)
        .attr("width", 30)
        .attr("height", 30)
        .attr("rx", "3")
        .attr("ry", "3")
        .attr("fill", "#8e8e8e")
        .attr("data-selected", 0)
        .style("cursor", "pointer")
        .on("click", handlefullscreen)
        .on("mouseover", handleFsMouseover)
        .on("mouseout", handleFsMouseout)

    g.append("rect")
        .attr("id", "fullscreenRect")
        .attr("x", rectBox.attr("x"))
        .attr("y", rectBox.attr("y"))
        .attr("width", 15)
        .attr("height", 15)
        .attr("rx", "3")
        .attr("ry", "3")
        .attr("fill", "#c9c9c9")
        .style("cursor", "pointer")
        .on("click", handlefullscreen)
        .on("mouseover", handleFsMouseover)
        .on("mouseout", handleFsMouseout);
    g.append("g")
        .attr("id", "venn")
        .style("opacity", 0);
    svg.transition()
        .ease(d3.easeCubic)
        .duration(1000)
        .style("opacity",1)
        .on("end", function(){
            svg.style("pointer-events", "all");
        });

}

var previousWidth;
function handleFsMouseover(){
    if(d3.select("#fullscreen").attr("data-selected") == 1){
        d3.select("#fullscreenRect")
            .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("width", 15)
            .attr("height", 15);
    }else{
        d3.select("#fullscreenRect")
            .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("width", 30)
            .attr("height", 30);
    }
}
function handleFsMouseout(){
    if(d3.select("#fullscreen").attr("data-selected") == 1){
        d3.select("#fullscreenRect")
            .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("width", 30)
            .attr("height", 30);
    }else{
        d3.select("#fullscreenRect")
            .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("width", 15)
            .attr("height", 15);
    }
}
function handlefullscreen(){
    if(d3.select("#fullscreen").attr("data-selected") == 1){
        d3.select("#fullscreen").attr("data-selected", 0);
        d3.select(".main").style("width", "60%");
        d3.selectAll(".aside")
            .style("display", "block")
            .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .style("opacity", 1).on("end",
                redraw);
        hideVennDiagram();
    } else{
        d3.select("#fullscreen").attr("data-selected", 1);
        d3.selectAll(".aside")
            .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .style("opacity", 0)
            .on("end", function(){
                d3.select(this).style("display", "none"); 
                d3.select(".main").style("width", "100%");
                redrawWithParams(document.body.offsetWidth, height);
            });
        generateVennDiagram();
    }
}
var chart = venn.VennDiagram();                
function hideVennDiagram(){
    g.select("#venn")
        .transition().ease(d3.easeCubic).duration("250")
        .style("opacity",0).on("end", function(){
            d3.select(this).style("display", "none");
        });
}
function generateVennDiagram(){                
    if(selectedLogics.length > 0){
        $.post("gettheoriesbylogicsinnerjoin", { ids : selectedLogics},
            function(data, status){
                g.select("#venn")
                    .datum(getSets(getPowerset(selectedLogics), data))
                    .call(chart).style("display","block").transition().ease(d3.easeCubic).duration("250")
                    .style("opacity",1);
            });
    }
}
function updateVennDiagram(){
    $.post("gettheoriesbylogicsinnerjoin", { ids : selectedLogics},
        function(data, status){
            g.select("#venn")
                .datum(getSets(getPowerset(selectedLogics), data))
                .call(chart).transition().ease(d3.easeCubic).duration("250").style("opacity", 1);
        });
}
function getSets(powersetArray, dataArray){
    var sets = [];
    for(logicSet of powersetArray){
        var contains = new Set();
        // go through all the data
        for(datum of dataArray){
            // if the theory belongs to the logic that is the first element:
            if(datum.logicsID == logicSet[0]){
                contains.add(datum.theoryID);
            }
        }
        // if there is more than one logic ->
        if(logicSet.length > 1){
            // for all the othe logics
            for(var i = 1; i < logicSet.length; i++){
                // check whether this theory is in the intersection
                var belongingToThisLogic = new Set();
                for(datum of dataArray){
                    if(datum.logicsID == logicSet[i]){
                        belongingToThisLogic.add(datum.theoryID);
                    }
                }
                contains.forEach(function(theoryID){
                    if(!belongingToThisLogic.has(theoryID)){
                        contains.delete(theoryID);
                    }
                });
            }
        }
        var actualSetNames = [];
        for(logic of logicSet){
            actualSetNames.push(selectedLogicsMap.get(logic)); 
        }
        sets.push({sets : actualSetNames, size: contains.size});
    }
    return sets;
}

function getPowerset(array){
    var result = [];
    for (var i = 1; i < (1 << array.length); i++) {
        var subset = [];
        for (var j = 0; j < array.length; j++){
            if (i & (1 << j)){
                subset.push(array[j]);
            } 
        }
        result.push(subset);
    }
    return result;
}

function getSVGString( svgNode ) {
	svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
	var cssStyleText = getCSSStyles( svgNode );
	appendCSS( cssStyleText, svgNode );

	var serializer = new XMLSerializer();
	var svgString = serializer.serializeToString(svgNode);
	svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); // Fix root xlink without namespace
	svgString = svgString.replace(/NS\d+:href/g, 'xlink:href'); // Safari NS namespace fix

	return svgString;

	function getCSSStyles( parentElement ) {
		var selectorTextArr = [];

		// Add Parent element Id and Classes to the list
		selectorTextArr.push( '#'+parentElement.id );
		for (var c = 0; c < parentElement.classList.length; c++)
				if ( !contains('.'+parentElement.classList[c], selectorTextArr) )
					selectorTextArr.push( '.'+parentElement.classList[c] );

		// Add Children element Ids and Classes to the list
		var nodes = parentElement.getElementsByTagName("*");
		for (var i = 0; i < nodes.length; i++) {
			var id = nodes[i].id;
			if ( !contains('#'+id, selectorTextArr) )
				selectorTextArr.push( '#'+id );

			var classes = nodes[i].classList;
			for (var c = 0; c < classes.length; c++)
				if ( !contains('.'+classes[c], selectorTextArr) )
					selectorTextArr.push( '.'+classes[c] );
		}

		// Extract CSS Rules
		var extractedCSSText = "";
		for (var i = 0; i < document.styleSheets.length; i++) {
			var s = document.styleSheets[i];
			
			try {
			    if(!s.cssRules) continue;
			} catch( e ) {
		    		if(e.name !== 'SecurityError') throw e; // for Firefox
		    		continue;
		    	}

			var cssRules = s.cssRules;
			for (var r = 0; r < cssRules.length; r++) {
				if ( contains( cssRules[r].selectorText, selectorTextArr ) )
					extractedCSSText += cssRules[r].cssText;
			}
		}
		

		return extractedCSSText;

		function contains(str,arr) {
			return arr.indexOf( str ) === -1 ? false : true;
		}

	}

	function appendCSS( cssText, element ) {
		var styleElement = document.createElement("style");
		styleElement.setAttribute("type","text/css"); 
		styleElement.innerHTML = cssText;
		var refNode = element.hasChildNodes() ? element.children[0] : null;
		element.insertBefore( styleElement, refNode );
	}
}


function svgString2Image( svgString, width, height, format, callback ) {
	var format = format ? format : 'png';
	var imgsrc = 'data:image/svg+xml;base64,'+ btoa( unescape( encodeURIComponent( svgString ) ) ); // Convert SVG string to data URL

	var canvas = document.createElement("canvas");
	var context = canvas.getContext("2d");

	canvas.width = width;
	canvas.height = height;

	var image = new Image();
	image.onload = function() {
		context.clearRect ( 0, 0, width, height );
		context.drawImage(image, 0, 0, width, height);
        callback(canvas.toDataURL("image/"+format));
	};
	image.src = imgsrc;
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
