var rs = {};
var trs = {};
var tvs = {};
var pas = {};
var cs = 60;  // cell size
var initGrid = function() {
var d3elt = d3.select('#draw');
d3elt.html('');
rs = {};
trs = {};
tvs = {};
pas = {};

var gh= env.gh; // height in cells
var gw = env.gw; // width in cells
var gs = env.gs; // total number of cells

var last_s = env.getLastState();
last_i = last_s['x'] + gw*last_s['y'];

var w = 600;
var h = 600;
svg = d3elt.append('svg').attr('width', w).attr('height', h)
    .append('g').attr('transform', 'scale(1)');

// define a marker for drawing arrowheads
svg.append("defs").append("marker")
    .attr("id", "arrowhead")
    .attr("refX", 3)
    .attr("refY", 2)
    .attr("markerWidth", 3)
    .attr("markerHeight", 4)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M 0,0 V 4 L3,2 Z");

for(var y=0;y<gh;y++) {
    for(var x=0;x<gw;x++) {
    var xcoord = x*cs;
    var ycoord = y*cs;
    var s = y*gw + x;

    var g = svg.append('g');
    // click callbackfor group
    g.on('click', function(ss) {
        return function() { cellClicked(ss); } // close over s
    }(s));

    // set up cell rectangles
    if(s==last_i){
        var r = g.append('rect')
        .attr('x', xcoord)
        .attr('y', ycoord)
        .attr('height', cs)
        .attr('width', cs)
        .attr('fill', '#FFF')
        .attr('stroke', 'red')
        .attr('stroke-width', 4);
    }
    else{
        var r = g.append('rect')
        .attr('x', xcoord)
        .attr('y', ycoord)
        .attr('height', cs)
        .attr('width', cs)
        .attr('fill', '#FFF')
        .attr('stroke', 'black')
        .attr('stroke-width', 2);
    }
    rs[s] = r;

    // reward text
    var tr = g.append('text')
        .attr('x', xcoord + 5)
        .attr('y', ycoord + 55)
        .attr('font-size', 10)
        .text('');
    trs[s] = tr;

    // value text
    var tv = g.append('text')
        .attr('x', xcoord + 5)
        .attr('y', ycoord + 20)
        .text('');
    tvs[s] = tv;
    
    // policy arrows
    pas[s] = []
    for(var a=0; a<2; a++) {
        var pa = g.append('line')
        .attr('x1', xcoord)
        .attr('y1', ycoord)
        .attr('x2', xcoord)
        .attr('y2', ycoord)
        .attr('stroke', 'black')
        .attr('stroke-width', '2')
        .attr("marker-end", "url(#arrowhead)");
        pas[s].push(pa);
    }
    }
}

// append agent position circle
svg.append('circle')
    .attr('cx', -100)
    .attr('cy', -100)
    .attr('r', 10)
    .attr('fill', '#FF0')
    .attr('stroke', '#000')
    .attr('id', 'cpos');
}

var drawGrid = function() {
var gh= env.gh; // height in cells
var gw = env.gw; // width in cells
var gs = env.gs; // total number of cells

var sx = env.stox(state);
var sy = env.stoy(state);      
d3.select('#cpos')
    .attr('cx', sx*cs+cs/2)
    .attr('cy', sy*cs+cs/2);

// updates the grid with current state of world/agent
for(var y=0;y<gh;y++) {
    for(var x=0;x<gw;x++) {
    var xcoord = x*cs;
    var ycoord = y*cs;
    var r=255,g=255,b=255;
    var s_i = env.xytos(x,y);
    var s = y*gw + x;
    
    // get value of state s under agent policy
    if(typeof agent.V !== 'undefined') {
        var vv = agent.V[s];
    } else if(typeof agent.Q !== 'undefined'){
        var poss = env.allowedActions(s_i);
        var vv = -1;
        for(var i=0,n=poss.length;i<n;i++) {
        var qsa = agent.Q[poss[i]*gs+s];
        if(i === 0 || qsa > vv) { vv = qsa; }
        }
    }
    //console.log(vv);

    var ms = 100;
    if(vv > 0) { g = 255; r = 255 - vv*ms; b = 255 - vv*ms; }
    if(vv < 0) { g = 255 + vv*ms; r = 255; b = 255 + vv*ms; }
    var vcol = 'rgb('+Math.floor(r)+','+Math.floor(g)+','+Math.floor(b)+')';
    //if(env.T[s] === 1) { vcol = "#AAA"; rcol = "#AAA"; }

    // update colors of rectangles based on value
    var r = rs[s];
    if(s === selected) {
        // highlight selected cell
        r.attr('fill', '#FF0');
    } else {
        r.attr('fill', vcol); 
    }

    // write reward texts
    // var rv = env.Rarr[s];
    // var tr = trs[s];
    // if(rv !== 0) {
    //     tr.text('R ' + rv.toFixed(1))
    // }

    // skip rest for cliff
    //if(env.T[s] === 1) continue; 

    // write value
    var tv = tvs[s];
    tv.text(vv.toFixed(2));
    
    // update policy arrows
    var paa = pas[s];
    for(var a=0; a<2; a++) {
        var pa = paa[a];
        var prob = agent.P[a*gs+s];
        if(prob < 0.01) { pa.attr('visibility', 'hidden'); }
        else { pa.attr('visibility', 'visible'); }
        if (isNaN(prob)) {var ss = cs/2*0.9;}
        else {var ss = cs/2 * prob * 0.9;}
        console.log(prob);
        if(a === 0) {nx=0; ny=-ss;}
        if(a === 1) {nx=0; ny=ss;}
        pa.attr('x1', xcoord+cs/2)
        .attr('y1', ycoord+cs/2)
        .attr('x2', xcoord+cs/2+nx)
        .attr('y2', ycoord+cs/2+ny);
    }
    }
}
}

var selected = -1;

var goslow = function() {
steps_per_tick = 1;
}
var gonormal = function(){
steps_per_tick = 10;
}
var gofast = function() {
steps_per_tick = 25;
}
var steps_per_tick = 1;
var sid = -1;
var nsteps_history = [];
var cum_rewards = 0.0;
var nflot = 100;
var tdlearn = function() {
if(sid === -1) {
    sid = setInterval(function(){
    for(var k=0;k<steps_per_tick;k++) {

        var a = agent.act(state); // ask agent for an action
        var obs = env.sampleNextState(state, a); // run it through environment dynamics
        agent.learn(obs.r); // allow opportunity for the agent to learn
        state = obs.ns; // evolve environment to next state
        cum_rewards += obs.r;
        if(typeof obs.reset_episode !== 'undefined') {
        agent.resetEpisode();
        // record the reward achieved
        if(nsteps_history.length >= nflot) {
            nsteps_history = nsteps_history.slice(1);
        }
        nsteps_history.push(cum_rewards);
        cum_rewards = 0.0;
        }
    }
    // keep track of reward history
    drawGrid(); // draw
    }, 20);
} else { 
    clearInterval(sid); 
    sid = -1;
}
}

function initGraph() {
var container = $("#flotreward");
var res = getFlotRewards();
series = [{
    data: res,
    lines: {fill: true}
}];
var plot = $.plot(container, series, {
    grid: {
    borderWidth: 1,
    minBorderMargin: 20,
    labelMargin: 10,
    backgroundColor: {
        colors: ["#FFF", "#e4f4f4"]
    },
    margin: {
        top: 10,
        bottom: 10,
        left: 10,
    }
    },
    xaxis: {
    min: 0,
    max: nflot
    },
    yaxis: {
    min: -100,
    max: 100
    }
});

setInterval(function(){
    series[0].data = getFlotRewards();
    plot.setData(series);
    plot.draw();
}, 100);
}
function getFlotRewards() {
// zip rewards into flot data
var res = [];
for(var i=0,n=nsteps_history.length;i<n;i++) {
    res.push([i, nsteps_history[i]]);
}
return res;
}