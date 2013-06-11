(function() {
  var PausablePlayer, Vec,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __slice = [].slice;

  window.colorPalette = {
    turquoise: '#1abc9c',
    greensea: '#16a085',
    emerland: '#2ecc71',
    nephritis: '#27ae60',
    peterriver: '#3498db',
    belizehole: '#2980b9',
    amethyst: '#9b59b6',
    wisteria: '#8e44ad',
    wetasphalt: '#34495e',
    midnightblue: '#2c3e50',
    sunflower: '#f1c40f',
    orange: '#f39c12',
    carrot: '#e67e22',
    pumpkin: '#d35400',
    alizarin: '#e74c3c',
    pomegranate: '#c0392b',
    clouds: '#ecf0f1',
    silver: '#bdc3c7',
    concrete: '#95a5a6',
    asbestos: '#7f8c8d'
  };

  (function() {
    var lastTime, vendor, vendors, _i, _len;

    lastTime = 0;
    vendors = ['webkit', 'moz'];
    for (_i = 0, _len = vendors.length; _i < _len; _i++) {
      vendor = vendors[_i];
      window.requestAnimationFrame = window[vendor + 'RequestAnimationFrame'];
      window.cancelAnimationFrame = window[vendor + 'CancelAnimationFrame'] || window[vendor + 'CancelRequestAnimationFrame'];
      if (window.requestAnimationFrame) {
        break;
      }
    }
    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = function(callback, element) {
        var currTime, id, timeToCall;

        currTime = new Date().getTime();
        timeToCall = Math.max(0, 16 - (currTime - lastTime));
        id = window.setTimeout((function() {
          return callback(currTime + timeToCall);
        }), timeToCall);
        lastTime = currTime + timeToCall;
        return id;
      };
    }
    if (!window.cancelAnimationFrame) {
      return window.cancelAnimationFrame = function(id) {
        return clearTimeout(id);
      };
    }
  })();

  window.runAnimationLoop = function(render, data, maxFrameRate) {
    var lastFrame, loop_function, minDelay, running;

    if (maxFrameRate == null) {
      maxFrameRate = 16;
    }
    running = null;
    lastFrame = +Date.now();
    if (maxFrameRate > 0) {
      minDelay = 1000.0 / maxFrameRate;
    } else {
      minDelay = 0.0;
    }
    loop_function = function(now) {
      var dt;

      if (running !== false) {
        requestAnimationFrame(loop_function);
        dt = now - lastFrame;
        if (dt >= minDelay) {
          running = render(dt, data);
          return lastFrame = now;
        }
      }
    };
    return loop_function(lastFrame);
  };

  Vec = (function() {
    function Vec(x, y) {
      this.x = x;
      this.y = y;
      if (this.y === void 0) {
        this.y = this.x.y;
        this.x = this.x.x;
      }
    }

    Vec.prototype.copy = function() {
      return new Vec(this.x, this.y);
    };

    Vec.prototype.add = function(v) {
      return new Vec(this.x + v.x, this.y + v.y);
    };

    Vec.prototype.addInPlace = function(v) {
      this.x += v.x;
      this.y += v.y;
      return this;
    };

    Vec.prototype.sub = function(v) {
      return new Vec(this.x - v.x, this.y - v.y);
    };

    Vec.prototype.subInPlace = function(v) {
      this.x -= v.x;
      this.y -= v.y;
      return this;
    };

    Vec.prototype.scale = function(x) {
      return new Vec(x * this.x, x * this.y);
    };

    Vec.prototype.scaleInPlace = function(x) {
      this.x *= x;
      this.y *= x;
      return this;
    };

    Vec.prototype.scalar = function(v) {
      return this.x * v.x + this.y * v.y;
    };

    Vec.prototype.rotate = function(theta) {
      var ct, st;

      ct = Math.cos(theta);
      st = Math.sin(theta);
      return new Vec(ct * this.x + st * this.y, -st * this.x + ct * this.y);
    };

    Vec.prototype.rotateInPlace = function(theta) {
      var ct, st, x, y;

      ct = Math.cos(theta);
      st = Math.sin(theta);
      x = ct * this.x + st * this.y;
      y = -st * this.x + ct * this.y;
      this.x = x;
      this.y = y;
      return this;
    };

    Vec.prototype.norm = function() {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    };

    Vec.prototype.normSquared = function() {
      return this.x * this.x + this.y * this.y;
    };

    Vec.prototype.perpendicular = function() {
      return new Vec(-this.y, this.x);
    };

    Vec.prototype.perpendicularInPlace = function() {
      var _ref;

      _ref = [-this.y, this.x], this.x = _ref[0], this.y = _ref[1];
      return this;
    };

    Vec.prototype.normalizeTo = function(a) {
      var norm, s;

      norm = this.norm();
      if (norm < 1e-5) {
        return new Vec(0, 0);
      } else {
        s = a / norm;
        return new Vec(this.x * s, this.y * s);
      }
    };

    Vec.prototype.normalizeToInPlace = function(a) {
      var norm, s;

      norm = this.norm();
      if (norm < 1e-5) {
        return this;
      } else {
        s = a / norm;
        this.x *= s;
        this.y *= s;
        return this;
      }
    };

    Vec.prototype.normalized = function() {
      return this.normalizeTo(1.0);
    };

    Vec.prototype.normalizedInPlace = function() {
      return this.normalizeToInPlace(1.0);
    };

    Vec.random = function(alpha) {
      return new Vec(alpha * (Math.random() - 0.5), alpha * (Math.random() - 0.5));
    };

    return Vec;

  })();

  window.Vec = Vec;

  /*
  * Creates a path description from an array of vectors
  * @param {Vec[]} seq - The array of points representing the path
  */


  window.pathStringFromVecSequence = function(seq) {
    var v;

    return 'M' + ((function() {
      var _i, _len, _results;

      _results = [];
      for (_i = 0, _len = seq.length; _i < _len; _i++) {
        v = seq[_i];
        _results.push(v.x + ',' + v.y);
      }
      return _results;
    })()).join('L');
  };

  PausablePlayer = (function() {
    function PausablePlayer(animationCallback) {
      this.animationCallback = animationCallback;
      this.runAnimationLoop = __bind(this.runAnimationLoop, this);
      this.curPlayerState = null;
      this.curFrameRequestId = null;
      this.mode = 'S';
      this.events = {};
    }

    PausablePlayer.prototype.on = function(event, callback) {
      if (event in this.events) {
        return this.events[event].push(callback);
      } else {
        return this.events[event] = [callback];
      }
    };

    PausablePlayer.prototype.off = function(event, callback) {
      if (event in this.events) {
        return this.events[event] = _.without(this.events[event], callback);
      }
    };

    PausablePlayer.prototype.trigger = function(event) {
      var callback, _i, _len, _ref, _results;

      _ref = this.events[event] || [];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        callback = _ref[_i];
        _results.push(callback());
      }
      return _results;
    };

    PausablePlayer.prototype.runAnimationLoop = function(render, data, maxFrameRate) {
      var lastFrame, loop_function, minDelay, running,
        _this = this;

      if (maxFrameRate == null) {
        maxFrameRate = 16;
      }
      running = null;
      lastFrame = +Date.now();
      if (maxFrameRate > 0) {
        minDelay = 1000.0 / maxFrameRate;
      } else {
        minDelay = 0.0;
      }
      loop_function = function(now) {
        var dt;

        if (running !== false) {
          _this.curFrameRequestId = requestAnimationFrame(loop_function);
          dt = now - lastFrame;
          if (dt >= minDelay) {
            running = render(dt, data);
            return lastFrame = now;
          }
        }
      };
      return loop_function(lastFrame);
    };

    PausablePlayer.prototype.play = function(extraData, maxFrameRate) {
      var curAnimationCallback,
        _this = this;

      if (extraData == null) {
        extraData = null;
      }
      if (maxFrameRate == null) {
        maxFrameRate = 0;
      }
      if (this.curPlayerState) {
        if (this.curPlayerState.mode === 'P') {
          return;
        }
        this.curPlayerState.mode = 'P';
      } else if (!this.curPlayerState) {
        this.curPlayerState = {
          mode: 'P'
        };
        curAnimationCallback = function(state) {
          return function() {
            var args;

            args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
            if (state.mode === 'S') {
              _this.stop();
              return false;
            } else if (state.mode === 'H') {
              _this.pause();
            } else if (state.mode === 'P') {
              state.mode = _this.animationCallback.apply(_this, args);
            }
            return true;
          };
        };
        this.runAnimationLoop(curAnimationCallback(this.curPlayerState), extraData, maxFrameRate);
      }
      this.mode = 'P';
      return this.trigger('play');
    };

    PausablePlayer.prototype.stop = function() {
      if (this.curPlayerState) {
        if (this.curFrameRequestId) {
          cancelAnimationFrame(this.curFrameRequestId);
        }
        this.curPlayerState.mode = 'S';
        this.curPlayerState = null;
        this.mode = 'S';
        return this.trigger('stop');
      }
    };

    PausablePlayer.prototype.pause = function() {
      if (this.curPlayerState) {
        if (this.curPlayerState.mode === 'H') {
          return;
        }
        if (this.curFrameRequestId) {
          cancelAnimationFrame(this.curFrameRequestId);
        }
        this.curPlayerState.mode = 'H';
        this.mode = 'H';
        return this.trigger('pause');
      }
    };

    return PausablePlayer;

  })();

  window.PausablePlayer = PausablePlayer;

}).call(this);

(function() {
  var Doodle, DoodleAnimation, DoodleSVGFrameRenderer, MultipleWordsAnimation, WordDoodlePhysicsState, ensureAspectRatio, eventCallbacks, filterWeirdCharacters, filterWords, getDoodleCenterLine, letterToQuadrantSequence, opposedQuadrant, quadrantPos, renderStrip, showErrorAlert, showFacebookSuccessAlert, sigmoid, wordEnergy, wordFluidity, wordQuadrantLength,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  window.Doodle = Doodle = {};

  Doodle.parameters = {
    doodleAmplitude: 34,
    doodleSize: 80,
    doodle8PenCenterJitter: 8,
    doodleAttractorStrength: 0.048,
    doodleDrag: 0.05,
    doodleStepDelta: 1.0 / 40,
    doodleRibbonMinWidth: 0.01,
    doodleRibbonMaxWidth: 0.8,
    doodleColor: '#3c66ba'
  };

  /**
  * Renders an uneven strip from a center line `points`
  * @param {Vec[]} points - The array of points representing the middle line
  * @param {Number} minWidth  - The minimal width of the ribbon
  * @param {Number} maxWidth  - The maximal width of the ribbon
  * @result {String} A string representing the brush path description
  */


  Doodle.renderStrip = renderStrip = function(points, minWidth, maxWidth) {
    var a, doodleRibbonWidth, i, pointsHalfLength, rD, rU, ribbon, ribbonDown, ribbonUp, uD, vA, vB, _i, _ref;

    ribbonUp = [];
    ribbonDown = [];
    doodleRibbonWidth = maxWidth - minWidth;
    pointsHalfLength = (points.length - 1) / 2;
    for (i = _i = 0, _ref = points.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      if (i < points.length - 1) {
        vA = points[i];
        vB = points[i + 1];
      } else {
        vA = points[i - 1];
        vB = points[i];
      }
      a = minWidth + doodleRibbonWidth * (1.0 - Math.abs(i / pointsHalfLength - 1.0));
      uD = vB.sub(vA).perpendicular().normalizeTo(a);
      rU = vA.add(uD);
      rD = vA.sub(uD);
      ribbonUp.push(rU);
      ribbonDown.push(rD);
    }
    ribbon = ribbonUp.concat(ribbonDown.reverse());
    return pathStringFromVecSequence(ribbon);
  };

  Doodle.letterToQuadrantSequence = letterToQuadrantSequence = {
    'y': '12',
    'b': '123',
    'p': '1234',
    'q': '12341',
    'n': '23',
    'm': '234',
    'f': '2341',
    'å': '23412',
    'e': '34',
    'l': '341',
    'k': '3412',
    'æ': '34123',
    'ä': '34123',
    't': '41',
    'c': '412',
    'z': '4123',
    '.': '41234',
    's': '14',
    'd': '143',
    'g': '1432',
    '\'': '14321',
    'ø': '14321',
    'ß': '14321',
    'ö': '14321',
    'a': '21',
    'r': '214',
    'x': '2143',
    '?': '21432',
    'o': '32',
    'u': '321',
    'v': '3214',
    'w': '32143',
    'i': '43',
    'h': '432',
    'j': '4321',
    ',': '43214'
  };

  Doodle.filterWeirdCharacters = filterWeirdCharacters = (function() {
    var allowedLetters, chars_rgx, d, i, in_chrs, l, lookup, out_chrs, transl, _i, _ref;

    allowedLetters = (function() {
      var _results;

      _results = [];
      for (l in letterToQuadrantSequence) {
        d = letterToQuadrantSequence[l];
        _results.push(l);
      }
      return _results;
    })();
    in_chrs = 'àáâãçèéêëìíîïñòóôõùúûüýÿÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ';
    out_chrs = 'aaaaceeeeiiiinoooouuuuyyAAAAACEEEEIIIINOOOOOUUUUY';
    chars_rgx = new RegExp('[' + in_chrs + ']', 'g');
    transl = {};
    lookup = function(m) {
      return transl[m] || m;
    };
    for (i = _i = 0, _ref = in_chrs.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      transl[in_chrs[i]] = out_chrs[i];
    }
    return function(word) {
      word = word.trim();
      word = word.toLowerCase();
      word = word.replace(chars_rgx, lookup);
      word = ((function() {
        var _j, _len, _results;

        _results = [];
        for (_j = 0, _len = word.length; _j < _len; _j++) {
          l = word[_j];
          if (allowedLetters.indexOf(l) >= 0) {
            _results.push(l);
          }
        }
        return _results;
      })()).join('');
      return word;
    };
  })();

  Doodle.filterWords = filterWords = function(words) {
    words = words.match(/\S+/g) || [];
    words = _.map(words, filterWeirdCharacters);
    words = _.compact(words);
    return words;
  };

  Doodle.wordQuadrantLength = wordQuadrantLength = function(word) {
    var i, l, length, qSeq, _i, _ref;

    word = filterWeirdCharacters(word);
    length = 0;
    for (i = _i = 0, _ref = word.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      l = word[i];
      qSeq = letterToQuadrantSequence[l];
      length += qSeq.length - 1;
    }
    return length;
  };

  Doodle.quadrantPos = quadrantPos = {
    '0': new Vec(0.0, 0.0),
    '1': new Vec(0.0, -1.0),
    '2': new Vec(1.0, 0.0),
    '3': new Vec(0.0, 1.0),
    '4': new Vec(-1.0, 0.0)
  };

  Doodle.opposedQuadrant = opposedQuadrant = {
    '1': '3',
    '2': '4',
    '3': '1',
    '4': '2'
  };

  Doodle.WordDoodlePhysicsState = WordDoodlePhysicsState = (function() {
    function WordDoodlePhysicsState(word, parameters) {
      var defaultParameters;

      this.word = word;
      if (parameters == null) {
        parameters = {};
      }
      defaultParameters = {
        jitter: Doodle.parameters.doodle8PenCenterJitter
      };
      this.parameters = _.defaults({}, parameters, defaultParameters);
      this.doodleSize = Doodle.parameters.doodleSize;
      this.stepDelta = Doodle.parameters.doodleStepDelta;
      this.amplitude = Doodle.parameters.doodleAmplitude;
      this.drag = Doodle.parameters.doodleDrag;
      this.attractorStrength = Doodle.parameters.doodleAttractorStrength;
    }

    WordDoodlePhysicsState.prototype.reinitPhysics = function() {
      var angle, centerW, isMovingClockwise, l, qA, qB;

      this.quadrantSequence = [];
      this.tween = 0.4;
      centerW = this.doodleSize / 2;
      this.leaderPos = new Vec(centerW, centerW);
      this.penPos = new Vec(centerW, centerW);
      this.penSpeed = new Vec(0, 0);
      this.centerPos = new Vec(centerW, centerW);
      this.quadrantSequence = '0' + ((function() {
        var _i, _len, _ref, _results;

        _ref = this.word;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          l = _ref[_i];
          _results.push(letterToQuadrantSequence[l]);
        }
        return _results;
      }).call(this)).join('0') + '0';
      if (this.word.length > 0) {
        qA = +this.quadrantSequence[1];
        qB = +this.quadrantSequence[2];
        isMovingClockwise = (qB - qA + 4) % 4 === 3;
        angle = (isMovingClockwise ? 1 : -1) * Math.PI / 4.0;
        this.penSpeed = quadrantPos[qA].copy().scaleInPlace(0.5).rotateInPlace(angle);
        l = this.quadrantSequence[this.quadrantSequence.length - 2];
        return this.quadrantSequence += opposedQuadrant[l];
      }
    };

    WordDoodlePhysicsState.prototype.stepPhysics = function() {
      var f, fracTween, i, qA, qB, vA, vB;

      this.tween += this.stepDelta;
      i = Math.floor(this.tween);
      fracTween = this.tween - i;
      if (i >= this.quadrantSequence.length - 1) {
        return false;
      }
      if (this.quadrantSequence[i] === '0' && fracTween <= this.stepDelta) {
        this.centerPos.x += (Math.random() - 0.5) * this.parameters.jitter;
        this.centerPos.y += (Math.random() - 0.5) * this.parameters.jitter;
      }
      qA = this.quadrantSequence[i];
      qB = this.quadrantSequence[i + 1];
      vA = quadrantPos[qA].scale(this.amplitude);
      vB = quadrantPos[qB].scale(this.amplitude);
      this.leaderPos = this.centerPos.copy().addInPlace(vA).addInPlace((vB.sub(vA)).scaleInPlace(fracTween));
      f = this.leaderPos.copy().subInPlace(this.penPos).normalizeToInPlace(this.attractorStrength);
      this.penSpeed.addInPlace(f).scaleInPlace(1 - this.drag);
      this.penPos.addInPlace(this.penSpeed);
      return true;
    };

    WordDoodlePhysicsState.prototype.getPoints = function() {
      var centerPosArray, leaderPosArray, penPosArray;

      if (this.parameters.randomSeed) {
        Math.seedrandom(this.parameters.randomSeed);
      }
      this.reinitPhysics();
      penPosArray = [];
      leaderPosArray = [];
      centerPosArray = [];
      while (this.stepPhysics()) {
        penPosArray.push(new Vec(this.penPos));
        leaderPosArray.push(new Vec(this.leaderPos));
        centerPosArray.push(new Vec(this.centerPos));
      }
      return [penPosArray, leaderPosArray, centerPosArray];
    };

    return WordDoodlePhysicsState;

  })();

  Doodle.getDoodleCenterLine = getDoodleCenterLine = function(word, width, parameters) {
    var bb_A, bb_B, bb_diag, centerPosArray, leaderPosArray, normalize_a, normalize_p, p, penPosArray, scale, update_bb_p, v_disp, _i, _len, _ref;

    if (parameters == null) {
      parameters = {};
    }
    _ref = new WordDoodlePhysicsState(word, parameters).getPoints(), penPosArray = _ref[0], leaderPosArray = _ref[1], centerPosArray = _ref[2];
    if (penPosArray.length > 0) {
      bb_A = new Vec(penPosArray[0]);
      bb_B = new Vec(penPosArray[0]);
      update_bb_p = function(p) {
        bb_A.x = Math.min(bb_A.x, p.x);
        bb_A.y = Math.min(bb_A.y, p.y);
        bb_B.x = Math.max(bb_B.x, p.x);
        return bb_B.y = Math.max(bb_B.y, p.y);
      };
      for (_i = 0, _len = penPosArray.length; _i < _len; _i++) {
        p = penPosArray[_i];
        update_bb_p(p);
      }
      bb_diag = bb_B.sub(bb_A);
      v_disp = new Vec(Doodle.parameters.doodleSize, Doodle.parameters.doodleSize).subInPlace(bb_diag).scaleInPlace(0.5).subInPlace(bb_A);
      scale = width / Doodle.parameters.doodleSize;
      normalize_p = function(p) {
        return p.addInPlace(v_disp).scaleInPlace(scale);
      };
      normalize_a = function(a) {
        return _.map(a, normalize_p);
      };
      return _.map([penPosArray, leaderPosArray, centerPosArray], normalize_a);
    }
  };

  Doodle.ensureAspectRatio = ensureAspectRatio = function(el, heightOverWidthRatio) {
    var callback;

    if (heightOverWidthRatio == null) {
      heightOverWidthRatio = 1.0;
    }
    callback = function() {
      var height, width;

      width = el.style('width').slice(0, -2);
      height = width * heightOverWidthRatio;
      return el.style('height', height + 'px');
    };
    window.addEventListener('resize', callback);
    return callback();
  };

  DoodleSVGFrameRenderer = (function() {
    function DoodleSVGFrameRenderer(svgEl, renderingParameters) {
      if (renderingParameters == null) {
        renderingParameters = {};
      }
      this.ribbonMinWidth = Doodle.parameters.doodleRibbonMinWidth;
      this.ribbonMaxWidth = Doodle.parameters.doodleRibbonMaxWidth;
      svgEl.attr('viewBox', "0 0 " + Doodle.parameters.doodleSize + " " + Doodle.parameters.doodleSize);
      if (renderingParameters.backgroundFill) {
        this.backgroundRect = svgEl.append('svg:rect').attr('x', 0).attr('y', 0).attr('fill', renderingParameters.backgroundFill).attr('width', '100%').attr('height', '100%');
      }
      this.pathEl = svgEl.append('svg:path').style('fill', renderingParameters.fill || Doodle.parameters.doodleColor).style('stroke', 'none').style('opacity', '0.8');
    }

    DoodleSVGFrameRenderer.prototype.clear = function() {
      return this.pathEl.attr('d', 'M 0,0');
    };

    DoodleSVGFrameRenderer.prototype.setFill = function(fill) {
      return this.pathEl.style('fill', fill);
    };

    DoodleSVGFrameRenderer.prototype.setBackgroundFill = function(fill) {
      if (fill) {
        return this.backgroundRect.style('display', 'block').attr('fill', fill);
      } else {
        return this.backgroundRect.style('display', 'none');
      }
    };

    DoodleSVGFrameRenderer.prototype.setPosArrays = function(posArrays) {
      this.penPosArray = posArrays[0], this.leaderPosArray = posArrays[1], this.centerPosArray = posArrays[2];
      return this.length = this.penPosArray.length;
    };

    DoodleSVGFrameRenderer.prototype.renderFrame = function(frame) {
      var penPosArray;

      while (frame < 0) {
        frame += this.length;
      }
      penPosArray = this.penPosArray.slice(0, frame + 1);
      return this.pathEl.attr('d', renderStrip(penPosArray, this.ribbonMinWidth, this.ribbonMaxWidth));
    };

    return DoodleSVGFrameRenderer;

  })();

  Doodle.DoodleAnimation = DoodleAnimation = (function() {
    function DoodleAnimation(id, parameters) {
      var container, defaultParameters, parent;

      this.id = id;
      if (parameters == null) {
        parameters = {};
      }
      this.serializeImage = __bind(this.serializeImage, this);
      this.animationCallback = __bind(this.animationCallback, this);
      this.setWord = __bind(this.setWord, this);
      this.showLastFrame = __bind(this.showLastFrame, this);
      this.play = __bind(this.play, this);
      this.clear = __bind(this.clear, this);
      this.setFill = __bind(this.setFill, this);
      this.onClick = __bind(this.onClick, this);
      defaultParameters = {
        randomSeed: null
      };
      this.parameters = _.defaults({}, parameters, defaultParameters);
      parent = d3.select(this.id);
      ensureAspectRatio(parent, 1);
      container = parent.append('div').style('position', 'relative');
      this.svg = container.append('svg:svg').attr('class', 'figure').attr('viewBox', "0 0 " + Doodle.parameters.doodleSize + " " + Doodle.parameters.doodleSize).style('width', '100%').style('height', '100%');
      this.doodle = this.svg.append('svg:g');
      this.frameRenderer = new DoodleSVGFrameRenderer(this.doodle, {
        backgroundFill: '#fff'
      });
      this.player = new PausablePlayer(this.animationCallback);
      this.svg.on('click', this.onClick);
    }

    DoodleAnimation.prototype.onClick = function() {
      d3.event.preventDefault();
      if (this.word) {
        return this.play();
      }
    };

    DoodleAnimation.prototype.setFill = function(fill) {
      return this.frameRenderer.setFill(fill);
    };

    DoodleAnimation.prototype.setBackgroundFill = function(fill) {
      return this.frameRenderer.setBackgroundFill(fill);
    };

    DoodleAnimation.prototype.clear = function() {
      this.player.stop();
      return this.frameRenderer.clear();
    };

    DoodleAnimation.prototype.play = function() {
      var animationData, duration, quadrantLength;

      if (!this.word) {
        return;
      }
      this.player.stop();
      quadrantLength = wordQuadrantLength(this.word);
      duration = Math.min(1.4, Math.max(quadrantLength / 8.0, 0.4));
      this.speed = Math.ceil(this.frameRenderer.length / (duration * 1000));
      animationData = {
        f: 1,
        frameRenderer: this.frameRenderer
      };
      this.player.play(animationData);
      return this;
    };

    DoodleAnimation.prototype.showLastFrame = function() {
      if (!this.word) {
        return;
      }
      this.player.stop();
      return this.frameRenderer.renderFrame(-1);
    };

    DoodleAnimation.prototype.setWord = function(word) {
      var words;

      this.word = word;
      words = Doodle.filterWords(this.word);
      if (words.length === 0) {
        words = ['hello'];
      }
      this.word = words[0];
      this.player.stop();
      this.posArrays = getDoodleCenterLine(this.word, Doodle.parameters.doodleSize, this.parameters);
      this.frameRenderer.setPosArrays(this.posArrays);
      return this;
    };

    DoodleAnimation.prototype.animationCallback = function(dt, data) {
      var f;

      f = Math.floor(data.f);
      if (f >= data.frameRenderer.length) {
        this.showLastFrame();
        return 'S';
      } else {
        data.frameRenderer.renderFrame(f);
      }
      data.f += this.speed * dt;
      return 'P';
    };

    DoodleAnimation.prototype.serializeImage = function(width) {
      var canvasEl, content, doodle, frameRenderer, imageContent, serializer, svg;

      if (width == null) {
        width = 400;
      }
      if (!this.word) {
        return;
      }
      svg = d3.select('body').append('svg:svg').attr('class', 'figure').attr('viewBox', "0 0 " + Doodle.parameters.doodleSize + " " + Doodle.parameters.doodleSize).style('position', 'absolute').style('left', -width - 1000).style('top', -width - 1000).style('width', width).style('height', width);
      doodle = svg.append('svg:g');
      frameRenderer = new DoodleSVGFrameRenderer(doodle, {
        backgroundFill: '#fff'
      });
      frameRenderer.setPosArrays(this.posArrays);
      frameRenderer.renderFrame(-1);
      serializer = new XMLSerializer();
      content = serializer.serializeToString(svg.node());
      canvasEl = $('<canvas>').css('display', 'none').appendTo($('body'));
      canvg(canvasEl[0], content);
      imageContent = canvasEl[0].toDataURL('image/png').split(',')[1];
      svg.remove();
      canvasEl.remove();
      return imageContent;
    };

    return DoodleAnimation;

  })();

  Doodle.MultipleWordsAnimation = MultipleWordsAnimation = (function() {
    function MultipleWordsAnimation(id, parameters) {
      var container, defaultParameters, parent;

      this.id = id;
      if (parameters == null) {
        parameters = {};
      }
      this.serializeImage = __bind(this.serializeImage, this);
      this.animationCallback = __bind(this.animationCallback, this);
      this.setWord = __bind(this.setWord, this);
      this.play = __bind(this.play, this);
      this.onClick = __bind(this.onClick, this);
      defaultParameters = {
        randomSeed: null
      };
      this.parameters = _.defaults({}, parameters, defaultParameters);
      parent = d3.select(this.id);
      container = parent.append('div').style('position', 'relative');
      this.svg = container.append('svg:svg').attr('class', 'figure').attr('viewBox', "0 0 " + Doodle.parameters.doodleSize + " " + Doodle.parameters.doodleSize);
      this.svg.append('svg:rect').attr('x', 0).attr('y', 0).attr('fill', '#fff').attr('width', '100%').attr('height', '100%');
      this.player = new PausablePlayer(this.animationCallback);
      this.svg.on('click', this.onClick);
    }

    MultipleWordsAnimation.prototype.onClick = function() {
      d3.event.preventDefault();
      if (this.words) {
        return this.play();
      }
    };

    MultipleWordsAnimation.prototype.play = function() {
      var animationData, duration, i, quadrantLength, speed, speeds, word, _i, _len, _ref;

      if (!this.words) {
        return;
      }
      this.player.stop();
      speeds = [];
      _ref = this.words;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        word = _ref[i];
        quadrantLength = wordQuadrantLength(word);
        duration = Math.min(1.4, Math.max(quadrantLength / 8.0, 0.4));
        speed = Math.ceil(this.renderers[i].length / (duration * 1000));
        speeds.push(speed);
        this.renderers[i].pathEl.attr('d', 'M 0, 0');
      }
      animationData = {
        wordIndex: 0,
        f: 1,
        renderers: this.renderers,
        speeds: speeds,
        nWords: this.words.length
      };
      this.player.play(animationData);
      return this;
    };

    MultipleWordsAnimation.prototype.setWord = function(words) {
      var curX, doodleSize, margin, nWords,
        _this = this;

      this.words = filterWords(words);
      if (this.words.length === 0) {
        this.words = ['hello'];
      }
      this.player.stop();
      this.lines = _.map(this.words, function(word) {
        return getDoodleCenterLine(word, Doodle.parameters.doodleSize, _this.parameters);
      });
      nWords = this.words.length;
      doodleSize = Doodle.parameters.doodleSize;
      margin = 10;
      curX = 0;
      this.svg.attr('viewBox', "0 0 " + (nWords * doodleSize + (nWords - 1) * margin) + " " + doodleSize);
      this.svg.selectAll('g.doodle-path').remove();
      this.renderers = _.map(this.lines, function(line) {
        var doodle, frameRenderer;

        doodle = _this.svg.append('svg:g').attr('class', 'doodle-path').attr('transform', "translate(" + curX + ", 0)");
        curX += doodleSize + margin;
        frameRenderer = new DoodleSVGFrameRenderer(doodle);
        frameRenderer.setPosArrays(line);
        return frameRenderer;
      });
      return this;
    };

    MultipleWordsAnimation.prototype.animationCallback = function(dt, data) {
      var f, wordIndex;

      wordIndex = data.wordIndex;
      f = Math.floor(data.f);
      if (f >= data.renderers[wordIndex].length) {
        data.renderers[wordIndex].renderFrame(-1);
        wordIndex += 1;
        data.wordIndex = wordIndex;
        data.f = f = 1;
        if (wordIndex >= data.nWords) {
          return 'S';
        }
      }
      data.renderers[wordIndex].renderFrame(f);
      data.f += data.speeds[wordIndex] * dt;
      return 'P';
    };

    MultipleWordsAnimation.prototype.serializeImage = function(width, max_width) {
      var canvas, content, curX, doodleSize, figHeight, figWidth, imageContent, margin, nWords, ratio, renderers, serializer, svg, totalHeight, totalWidth,
        _this = this;

      if (width == null) {
        width = 400;
      }
      if (max_width == null) {
        max_width = 1000;
      }
      if (!this.words) {
        return;
      }
      svg = d3.select('body').append('svg:svg').attr('class', 'figure').style('position', 'absolute');
      svg.append('svg:rect').attr('x', 0).attr('y', 0).attr('width', '100%').attr('height', '100%').style('fill', '#fff');
      doodleSize = Doodle.parameters.doodleSize;
      nWords = this.words.length;
      margin = 10;
      totalWidth = doodleSize * nWords + margin * (nWords - 1);
      totalHeight = doodleSize;
      ratio = width / doodleSize;
      if (totalWidth * ratio > max_width) {
        ratio *= max_width / totalWidth;
      }
      figWidth = ratio * totalWidth;
      figHeight = ratio * totalHeight;
      svg.attr('viewBox', "0 0 " + (doodleSize * nWords + margin * (nWords - 1)) + " " + doodleSize).style('left', -figWidth - 1000).style('top', -figHeight - 1000).style('width', figWidth).style('height', figHeight);
      curX = 0;
      renderers = _.map(this.lines, function(line) {
        var doodle, frameRenderer;

        doodle = svg.append('svg:g').attr('class', 'doodle-path').attr('transform', "translate(" + curX + ", 0)");
        curX += doodleSize + margin;
        frameRenderer = new DoodleSVGFrameRenderer(doodle);
        frameRenderer.setPosArrays(line);
        frameRenderer.renderFrame(-1);
        return frameRenderer;
      });
      serializer = new XMLSerializer();
      content = serializer.serializeToString(svg.node());
      canvas = d3.select('body').append('canvas').style('display', 'none');
      canvg(canvas.node(), content);
      imageContent = canvas.node().toDataURL('image/png').split(',')[1];
      svg.remove();
      canvas.remove();
      return imageContent;
    };

    return MultipleWordsAnimation;

  })();

  window.DoodlePageUtils = {};

  eventCallbacks = {};

  DoodlePageUtils.bindOn = function(event, callback) {
    var callbacks;

    callbacks = eventCallbacks[event] || [];
    callbacks.push(callback);
    return eventCallbacks[event] = callbacks;
  };

  DoodlePageUtils.bindOff = function(event, callback) {
    return eventCallbacks[event] = _.without(eventCallbacks[event] || [], callback);
  };

  DoodlePageUtils.trigger = function(event, param) {
    var callback, _i, _len, _ref, _results;

    _ref = eventCallbacks[event];
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      callback = _ref[_i];
      _results.push(callback(param));
    }
    return _results;
  };

  DoodlePageUtils.downloadAsPng = function(imageContent, word) {
    var a;

    a = $('<a>').attr('download', "8penDoodle_" + word + ".png").attr('href', 'data:application/octet-stream;base64,' + imageContent).attr('display', 'none').appendTo('body');
    a[0].click();
    return a.remove();
  };

  showErrorAlert = function() {
    return Messenger().post({
      message: 'Error uploading image to Facebook, please try again.',
      hideAfter: 3,
      type: 'error',
      showCloseButton: true
    });
  };

  showFacebookSuccessAlert = function() {
    return Messenger().post({
      message: 'The doodle has been posted to your Facebook Timeline.',
      hideAfter: 3,
      showCloseButton: true
    });
  };

  DoodlePageUtils.uploadAndPostToFacebook = function(eightPen) {
    var imageContent, postToFacebook, word,
      _this = this;

    if (!eightPen.words) {
      showErrorAlert();
      return;
    }
    imageContent = eightPen.serializeImage(100);
    word = eightPen.words.join(' ');
    DoodlePageUtils.trigger('uploading', true);
    postToFacebook = function(url) {
      return FB.ui({
        method: 'feed',
        name: '8pen Doodle',
        caption: "I doodled \"" + word + "\" with 8pen!",
        description: "8pen is a fast and natural way to write on mobile devices. Words look like fun doodles. Create your own, and share them with your friends!",
        link: "http://www.8pen.com/doodle#" + word,
        picture: url
      }, function(response) {
        if (response && response.post_id) {
          return showFacebookSuccessAlert();
        }
      });
    };
    return $.ajax({
      url: 'https://api.imgur.com/3/image',
      type: 'POST',
      dataType: 'json',
      data: {
        type: 'base64',
        key: 'b6d62279d70a80a1f69f6f9b021ef22aa35fdc08',
        name: "8penDoodle_" + word + ".png",
        title: this.word,
        caption: "Doodle written with 8pen gestures: http://www.8pen.com/doodle#" + word,
        image: imageContent
      },
      beforeSend: function(request) {
        return request.setRequestHeader("Authorization", "Client-ID ce387304e2ba057");
      },
      success: function(data) {
        postToFacebook(data.data.link);
        return DoodlePageUtils.trigger('uploading', false);
      },
      error: function(e) {
        DoodlePageUtils.trigger('uploading', false);
        return showErrorAlert();
      }
    });
  };

  DoodlePageUtils.embeddedCode = function(embedInfo) {
    var animateOnStart, fill, transparent, width, word;

    word = encodeURIComponent(embedInfo.word || 'hello');
    fill = encodeURIComponent(embedInfo.fill || Doodle.parameters.doodleColor);
    animateOnStart = embedInfo.animateOnStart !== void 0 ? embedInfo.animateOnStart : true;
    width = embedInfo.size || '260';
    transparent = embedInfo.transparent !== void 0 ? embedInfo.transparent : false;
    return ("<iframe src='http://8pen.com/doodle_embed#word=" + word + "&fill=" + fill + "&animateOnStart=" + animateOnStart + "&transparent=" + transparent + "' ") + ("width='" + width + "px' height='" + width + "px'></iframe>");
  };

  Doodle.bindInput = function(el, callback) {
    el.on('keyup', function(e) {
      if (e.keyCode === 13) {
        return callback();
      }
    });
    return el.on('blur', function(e) {
      return callback();
    });
  };

  Doodle.wordEnergy = wordEnergy = (function() {
    var knotEnergy, knotNormalization, knotSymmetrization;

    knotEnergy = {
      '1423': 1 / 4.0,
      '1421': 1 / 2.0,
      '1414': 2 / 3.0,
      '1412': 3 / 4.0,
      '1434': 3 / 4.0,
      '1441': 3 / 2.0,
      '1443': 2.0,
      '1432': 4.0
    };
    knotSymmetrization = {
      1: 1,
      2: 4,
      3: 3,
      4: 4
    };
    knotNormalization = function(knot) {
      var baseNumber, i;

      baseNumber = parseInt(knot[0]);
      knot = (function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = knot.length; _i < _len; _i++) {
          i = knot[_i];
          _results.push(((parseInt(i) - baseNumber + 4) % 4) + 1);
        }
        return _results;
      })();
      if (knot[1] === 2) {
        knot = (function() {
          var _i, _len, _results;

          _results = [];
          for (_i = 0, _len = knot.length; _i < _len; _i++) {
            i = knot[_i];
            _results.push(knotSymmetrization[i]);
          }
          return _results;
        })();
      }
      return (function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = knot.length; _i < _len; _i++) {
          i = knot[_i];
          _results.push(i.toString());
        }
        return _results;
      })();
    };
    return function(word, withLength) {
      var energy, i, knot, lA, lB, qSeqA, qSeqB, _i, _ref;

      if (withLength == null) {
        withLength = false;
      }
      word = filterWeirdCharacters(word);
      energy = 1.0;
      for (i = _i = 1, _ref = word.length; 1 <= _ref ? _i < _ref : _i > _ref; i = 1 <= _ref ? ++_i : --_i) {
        lA = word[i - 1];
        lB = word[i];
        qSeqA = letterToQuadrantSequence[lA];
        qSeqB = letterToQuadrantSequence[lB];
        knot = [qSeqA[qSeqA.length - 2], qSeqA[qSeqA.length - 1], qSeqB[0], qSeqB[1]];
        knot = (knotNormalization(knot)).join('');
        energy *= knotEnergy[knot];
      }
      if (withLength) {
        return energy * wordQuadrantLength(word);
      } else {
        return energy;
      }
    };
  })();

  sigmoid = function(t) {
    return 100 / (1 + Math.pow(Math.E, -t));
  };

  Doodle.wordFluidity = wordFluidity = function(word) {
    var energy;

    energy = wordEnergy(word);
    if (energy < 1) {
      return sigmoid(1 / energy);
    } else {
      return sigmoid(-energy / 8);
    }
  };

  Messenger.options = {
    extraClasses: 'messenger-fixed messenger-on-bottom',
    theme: 'block'
  };

}).call(this);
