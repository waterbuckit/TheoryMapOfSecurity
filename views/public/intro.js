var max = 5;
init();
function init(){
    d3.select("body").transition()
        .ease(d3.easeCubic)
        .duration("1200")
        .style("opacity", 1);
}
function begin(){
    d3.select("#i1").transition()
        .ease(d3.easeCubic)
        .duration("250")
        .style("opacity", 0)
        .on("end", function(){
            d3.select(this).style("display", "none");
            d3.select("#i2").style("display", "block").transition()
                .ease(d3.easeCubic)
                .duration("250")
                .style("opacity", 1)
        });
}
function next(elem){

    d3.selectAll(".content").transition()
        .ease(d3.easeCubic)
        .duration("250")
        .style("opacity", 0)
        .on("end", function(){
            d3.select(this).style("display", "none");
            var nextID= (parseInt($(elem).parent().attr("id").split("i")[1])+1);
            d3.select("#i"+nextID).style("display", "block").transition()
                .ease(d3.easeCubic)
                .duration("250")
                .style("opacity", 1)
        });

}
function prev(elem){
    d3.selectAll(".content").transition()
            .ease(d3.easeCubic)
            .duration("250")
            .style("opacity", 0)
            .on("end", function(){
                d3.select(this).style("display", "none");
                var nextID= (parseInt($(elem).parent().attr("id").split("i")[1])-1);
                d3.select("#i"+nextID).style("display", "block").transition()
                    .ease(d3.easeCubic)
                    .duration("250")
                    .style("opacity", 1)
            });
}
