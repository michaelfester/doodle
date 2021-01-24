// Generated by CoffeeScript 1.6.3
(function() {
  var DOODLE_AMPLITUDE, DOODLE_ATTRACTOR_STRENGTH, DOODLE_COLOR, DOODLE_DRAG, DOODLE_JITTER, DOODLE_RIBBON_MAX_WIDTH, DOODLE_RIBBON_MIN_WIDTH, DOODLE_SIZE, DOODLE_STEP_DELTA, DoodleAnimation, PausablePlayer, Vec, WordDoodlePhysicsState, filterWeirdCharacters, filterWords, getDoodleCenterLine, letterToQuadrantSequence, opposedQuadrant, pathStringFromVecSequence, quadrantPos, renderStrip, runAnimationLoop, wordQuadrantLength,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __slice = [].slice;

  (function() {
    var lastTime, vendor, vendors, _i, _len;
    lastTime = 0;
    // vendors = ['webkit', 'moz'];
    // for (_i = 0, _len = vendors.length; _i < _len; _i++) {
    //   vendor = vendors[_i];
    //   window.requestAnimationFrame = window[vendor + 'RequestAnimationFrame'];
    //   window.cancelAnimationFrame = window[vendor + 'CancelAnimationFrame'] || window[vendor + 'CancelRequestAnimationFrame'];
    //   if (window.requestAnimationFrame) {
    //     break;
    //   }
    // }
    // if (!window.requestAnimationFrame) {
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
    // }
    // if (!window.cancelAnimationFrame) {
      return window.cancelAnimationFrame = function(id) {
        return clearTimeout(id);
      };
    // }
  })();

  runAnimationLoop = function(render, data, maxFrameRate) {
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

  /*
  * Animation player object that can play / pause / stop,
  * uses requestAnimationFrame
  */


  PausablePlayer = (function() {
    function PausablePlayer(animationCallback) {
      this.animationCallback = animationCallback;
      this.runAnimationLoop = __bind(this.runAnimationLoop, this);
      this.curPlayerState = null;
      this.curFrameRequestId = null;
      this.mode = 'S';
      this.events = {};
    }

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
      return this.mode = 'P';
    };

    PausablePlayer.prototype.stop = function() {
      if (this.curPlayerState) {
        if (this.curFrameRequestId) {
          cancelAnimationFrame(this.curFrameRequestId);
        }
        this.curPlayerState.mode = 'S';
        this.curPlayerState = null;
        return this.mode = 'S';
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
        return this.mode = 'H';
      }
    };

    return PausablePlayer;

  })();

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

  /*
  * Creates a path description from an array of vectors
  * @param {Vec[]} seq - The array of points representing the path
  */


  pathStringFromVecSequence = function(seq) {
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

  DOODLE_AMPLITUDE = 34;

  DOODLE_SIZE = 80;

  DOODLE_JITTER = 8;

  DOODLE_ATTRACTOR_STRENGTH = 0.048;

  DOODLE_DRAG = 0.05;

  DOODLE_STEP_DELTA = 1.0 / 40;

  DOODLE_RIBBON_MIN_WIDTH = 0.01;

  DOODLE_RIBBON_MAX_WIDTH = 0.8;

  DOODLE_COLOR = '#3c66ba';

  /*
  * Renders an uneven strip from a center line `points`
  * @param {Vec[]} points - The array of points representing the middle line
  * @param {Number} minWidth  - The minimal width of the ribbon
  * @param {Number} maxWidth  - The maximal width of the ribbon
  * @result {String} A string representing the brush path description
  */


  renderStrip = function(points, minWidth, maxWidth) {
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

  letterToQuadrantSequence = {
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

  filterWeirdCharacters = (function() {
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

  filterWords = function(words) {
    var word;
    words = words.match(/\S+/g) || [];
    words = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = words.length; _i < _len; _i++) {
        word = words[_i];
        _results.push(filterWeirdCharacters(word));
      }
      return _results;
    })();
    words = words.filter(function(word) {
      return word && word.length > 0;
    });
    return words;
  };

  wordQuadrantLength = wordQuadrantLength = function(word) {
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

  quadrantPos = quadrantPos = {
    '0': new Vec(0.0, 0.0),
    '1': new Vec(0.0, -1.0),
    '2': new Vec(1.0, 0.0),
    '3': new Vec(0.0, 1.0),
    '4': new Vec(-1.0, 0.0)
  };

  opposedQuadrant = opposedQuadrant = {
    '1': '3',
    '2': '4',
    '3': '1',
    '4': '2'
  };

  /*
  * Create a physics state with an attractor describing the motion between
  * 8pen sectors, and a pen particle following the attractor
  * @param {String} word - The word to display
  */


  WordDoodlePhysicsState = (function() {
    function WordDoodlePhysicsState(word) {
      this.word = word;
    }

    WordDoodlePhysicsState.prototype.reinitPhysics = function() {
      var angle, centerW, isMovingClockwise, l, qA, qB;
      this.quadrantSequence = [];
      this.tween = 0.4;
      centerW = DOODLE_SIZE / 2;
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
      this.tween += DOODLE_STEP_DELTA;
      i = Math.floor(this.tween);
      fracTween = this.tween - i;
      if (i >= this.quadrantSequence.length - 1) {
        return false;
      }
      if (this.quadrantSequence[i] === '0' && fracTween <= DOODLE_STEP_DELTA) {
        this.centerPos.x += (Math.random() - 0.5) * DOODLE_JITTER;
        this.centerPos.y += (Math.random() - 0.5) * DOODLE_JITTER;
      }
      qA = this.quadrantSequence[i];
      qB = this.quadrantSequence[i + 1];
      vA = quadrantPos[qA].scale(DOODLE_AMPLITUDE);
      vB = quadrantPos[qB].scale(DOODLE_AMPLITUDE);
      this.leaderPos = this.centerPos.copy().addInPlace(vA).addInPlace((vB.sub(vA)).scaleInPlace(fracTween));
      f = this.leaderPos.copy().subInPlace(this.penPos).normalizeToInPlace(DOODLE_ATTRACTOR_STRENGTH);
      this.penSpeed.addInPlace(f).scaleInPlace(1 - DOODLE_DRAG);
      this.penPos.addInPlace(this.penSpeed);
      return true;
    };

    WordDoodlePhysicsState.prototype.getPoints = function() {
      var penPosArray;
      Math.seedrandom('8pen');
      this.reinitPhysics();
      penPosArray = [];
      while (this.stepPhysics()) {
        penPosArray.push(new Vec(this.penPos));
      }
      return penPosArray;
    };

    return WordDoodlePhysicsState;

  })();

  /*
  * Center & rescale the doodle centerline to fit in a width * width square
  */


  getDoodleCenterLine = function(word, width) {
    var bb_A, bb_B, bb_diag, normalize_p, p, penPosArray, scale, update_bb_p, v_disp, _i, _len;
    penPosArray = new WordDoodlePhysicsState(word).getPoints();
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
      v_disp = new Vec(DOODLE_SIZE, DOODLE_SIZE).subInPlace(bb_diag).scaleInPlace(0.5).subInPlace(bb_A);
      scale = width / DOODLE_SIZE;
      normalize_p = function(p) {
        return p.addInPlace(v_disp).scaleInPlace(scale);
      };
      return (function() {
        var _j, _len1, _results;
        _results = [];
        for (_j = 0, _len1 = penPosArray.length; _j < _len1; _j++) {
          p = penPosArray[_j];
          _results.push(normalize_p(p));
        }
        return _results;
      })();
    } else {
      return [];
    }
  };

  window.DoodleAnimation = DoodleAnimation = (function() {
    function DoodleAnimation(id) {
      var container, parent;
      this.id = id;
      this.animationCallback = __bind(this.animationCallback, this);
      this.setWord = __bind(this.setWord, this);
      this.showLastFrame = __bind(this.showLastFrame, this);
      this.play = __bind(this.play, this);
      this.onClick = __bind(this.onClick, this);
      parent = d3.select(this.id);
      container = parent.append('div').style('position', 'relative');
      this.svg = container.append('svg:svg').attr('class', 'figure').attr('viewBox', "0 0 " + DOODLE_SIZE + " " + DOODLE_SIZE).style('width', '100%').style('height', '100%');
      this.doodle = this.svg.append('svg:g');
      this.pathEl = this.doodle.append('svg:path').style('fill', DOODLE_COLOR).style('stroke', 'none').style('opacity', '0.8');
      this.player = new PausablePlayer(this.animationCallback);
      this.svg.on('click', this.onClick);
    }

    DoodleAnimation.prototype.onClick = function() {
      d3.event.preventDefault();
      if (this.word) {
        return this.play();
      }
    };

    DoodleAnimation.prototype.play = function() {
      var animationData, duration, quadrantLength;
      if (!this.word) {
        return;
      }
      this.player.stop();
      quadrantLength = wordQuadrantLength(this.word);
      duration = Math.min(1.4, Math.max(quadrantLength / 8.0, 0.4));
      this.speed = Math.ceil(this.frameNumber / (duration * 1000));
      animationData = {
        f: 1
      };
      this.player.play(animationData);
      return this;
    };

    DoodleAnimation.prototype.showLastFrame = function() {
      if (!this.word) {
        return;
      }
      this.player.stop();
      return this.renderFrame(-1);
    };

    DoodleAnimation.prototype.renderFrame = function(frame) {
      var points;
      if (!this.word) {
        return;
      }
      while (frame < 0) {
        frame += this.frameNumber;
      }
      points = this.penPosArray.slice(0, frame + 1);
      return this.pathEl.attr('d', renderStrip(points, DOODLE_RIBBON_MIN_WIDTH, DOODLE_RIBBON_MAX_WIDTH));
    };

    DoodleAnimation.prototype.setWord = function(word) {
      var words;
      this.word = word;
      words = filterWords(this.word);
      if (words.length === 0) {
        words = ['hello'];
      }
      this.word = words[0];
      this.player.stop();
      this.penPosArray = getDoodleCenterLine(this.word, DOODLE_SIZE, this.parameters);
      this.frameNumber = this.penPosArray.length;
      return this;
    };

    DoodleAnimation.prototype.animationCallback = function(dt, data) {
      var f;
      f = Math.floor(data.f);
      if (f >= this.frameNumber) {
        this.showLastFrame();
        return 'S';
      } else {
        this.renderFrame(f);
      }
      data.f += this.speed * dt;
      return 'P';
    };

    return DoodleAnimation;

  })();

}).call(this);
