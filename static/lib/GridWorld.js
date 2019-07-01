var Gridworld = function(){
  this.set()
}
Gridworld.prototype = {
  reset: function(data) {
    this.R = data["rewards"];
    this.S = data["states"];
    this.S_t = data["final_state"];
    console.log(this.R);
    console.log(this.S);
    console.log(this.S_t);
  },
  set: function() {
    this.gh = 9; //3 states for 10 days window, 3 states for 30 days window
    this.gw = 9; //3 states for 90 days window, 3 states for 270 days window
    this.gs = this.gh * this.gw; // number of states

    this.R = [0.0]; // rewards
    this.S = [{'x': 0, 'y':0}]; // states
    this.S_t = {'x': 8, 'y':8};
  },
  reward: function(s,a,ns) {
    // reward of being in s, taking action a, and ending up in ns
    var r = this.R[s];
    if(a === 0) {r = -r;} // short
    return r*10.0;
  },
  nextStateDistribution: function(s,a) {
    // gridworld is deterministic, so return only a single next state
    return s+1;
  },
  sampleNextState: function(s,a) {
    // gridworld is deterministic, so this is easy
    var ns = this.nextStateDistribution(s,a);
    if(ns < this.S.length){
      var r = this.reward(s,a,ns); // observe the raw reward of being in s, taking a, and ending up in ns
      var out = {'ns':ns, 'r':r};
    }
    else{
      // episode is over
      ns = this.randomState();
      var r = this.reward(s,a,ns); // observe the raw reward of being in s, taking a, and ending up in ns
      var out = {'ns':ns, 'r':r};
      out.reset_episode = true;
    }
    return out;
  },
  allowedActions: function(s) {
    return [0, 1];
  },
  randomState: function() { return Math.floor(Math.random()*this.S.length); },
  startState: function() { return 0; },
  getNumStates: function() { return this.gs; },
  getMaxNumActions: function() { return 2; },
  getLastState: function() { return this.S_t; },

  // private functions
  stox: function(s) { return this.S[s]['x']; },
  stoy: function(s) { return this.S[s]['y']; },
  xytos: function(x,y) { 
    for(var i=0; i<this.S.length; i++){
      if (this.S[i]['x']==x && this.S[i]['y'] == y){
        return i;
      }
    }
    return this.randomState(); },
}