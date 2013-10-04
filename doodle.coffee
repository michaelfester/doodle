# 8pen doodle animation -- http://8pen.com/doodle
# License: GPL

# requestAnimationFrame shim for older browsers
do ->
    lastTime = 0
    vendors = ['webkit', 'moz']
    for vendor in vendors
        window.requestAnimationFrame = window[vendor+'RequestAnimationFrame']
        window.cancelAnimationFrame =
          window[vendor+'CancelAnimationFrame'] ||
            window[vendor+'CancelRequestAnimationFrame']
        break if window.requestAnimationFrame
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = (callback, element) ->
            currTime = new Date().getTime()
            timeToCall = Math.max(0, 16 - (currTime - lastTime))
            id = window.setTimeout((() -> callback(currTime + timeToCall)),
              timeToCall)
            lastTime = currTime + timeToCall
            return id
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = (id) ->
            clearTimeout(id)

# Animation loop helper, where you can set a maxFrameRate
runAnimationLoop = (render, data, maxFrameRate=16) ->
    running = null
    lastFrame = +Date.now()
    if maxFrameRate > 0
        minDelay = 1000.0/maxFrameRate
    else
        minDelay = 0.0
    loop_function = (now) ->
        if(running != false)
            requestAnimationFrame(loop_function)
            dt = now - lastFrame
            if dt >= minDelay
                running = render(dt, data)
                lastFrame = now
    loop_function(lastFrame)

###
* Animation player object that can play / pause / stop,
* uses requestAnimationFrame
###
class PausablePlayer
    constructor: (@animationCallback) ->
        # animationCallback is of the form (dt) -> or (dt, extraData) ->
        # where dt is in milliseconds, and extraData can optionally contain
        # extra state data for the animation
        #
        # animationCallback should return:
        #  'P' to continue playing
        #  'S' to stop
        #  'H' to pause
        @curPlayerState = null
        @curFrameRequestId = null
        @mode = 'S'
        @events = {}

    runAnimationLoop: (render, data, maxFrameRate=16) =>
        running = null
        lastFrame = +Date.now()
        if maxFrameRate > 0
            minDelay = 1000.0/maxFrameRate
        else
            minDelay = 0.0
        loop_function = (now) =>
            if(running != false)
                @curFrameRequestId = requestAnimationFrame(loop_function)
                dt = now - lastFrame
                if dt >= minDelay
                    running = render(dt, data)
                    lastFrame = now
        loop_function(lastFrame)

    play: (extraData=null, maxFrameRate=0) ->
        if @curPlayerState
            if @curPlayerState.mode == 'P'
                return
            @curPlayerState.mode = 'P'
        else if !@curPlayerState
            @curPlayerState =
                mode: 'P' # play
            curAnimationCallback = (state) =>
                (args...) =>
                    if state.mode == 'S'
                        @stop()
                        return false
                    else if state.mode == 'H'
                        @pause()
                    else if state.mode == 'P'
                        state.mode = @animationCallback(args...)
                    return true
            @runAnimationLoop(curAnimationCallback(@curPlayerState), extraData, maxFrameRate)
        @mode = 'P'

    stop: () ->
        if @curPlayerState
            if @curFrameRequestId
                cancelAnimationFrame(@curFrameRequestId)
            @curPlayerState.mode = 'S' # stop
            @curPlayerState = null
            @mode = 'S'

    pause: () ->
        if @curPlayerState
            if @curPlayerState.mode == 'H'
                return
            if @curFrameRequestId
                cancelAnimationFrame(@curFrameRequestId)
            @curPlayerState.mode = 'H' # hold
            @mode = 'H'

# Very simple vector class
class Vec
    constructor: (@x, @y) ->
        # Allow a call to Vec(other_vec)
        if @y is undefined
            @y = @x.y
            @x = @x.x

    copy: () -> new Vec(@x, @y)

    add: (v) -> new Vec(@x + v.x, @y + v.y)
    addInPlace: (v) ->
        @x += v.x
        @y += v.y
        return @

    sub: (v) -> new Vec(@x - v.x, @y - v.y)
    subInPlace: (v) ->
        @x -= v.x
        @y -= v.y
        return @

    scale: (x) -> new Vec(x * @x, x * @y)
    scaleInPlace: (x) ->
        @x *= x
        @y *= x
        return @

    scalar: (v) -> @x*v.x + @y*v.y

    rotate: (theta) ->
        ct = Math.cos(theta)
        st = Math.sin(theta)
        new Vec(ct*@x + st*@y, -st*@x + ct*@y)
    rotateInPlace: (theta) ->
        ct = Math.cos(theta)
        st = Math.sin(theta)
        x = ct * @x + st * @y
        y = -st * @x + ct * @y
        @x = x
        @y = y
        return @

    norm: () -> Math.sqrt(@x*@x + @y*@y)
    normSquared: () -> @x*@x + @y*@y

    perpendicular: () -> new Vec(-@y, @x) # vec.rotate(Math.PI / 2)
    perpendicularInPlace: () ->
        [@x, @y] = [-@y, @x]
        return @

    normalizeTo: (a) ->
        norm = @norm()
        if norm < 1e-5
            new Vec(0, 0)
        else
            s = a/norm
            new Vec(@x*s, @y*s)
    normalizeToInPlace: (a) ->
        norm = @norm()
        if norm < 1e-5
            return @ # Vec = 0
        else
            s = a/norm
            @x *= s
            @y *= s
            return @

    normalized: () -> @normalizeTo(1.0)
    normalizedInPlace: () -> @normalizeToInPlace(1.0)

    @random: (alpha) ->
        new Vec(alpha*(Math.random()-0.5), alpha*(Math.random()-0.5))

###
* Creates a path description from an array of vectors
* @param {Vec[]} seq - The array of points representing the path
###
pathStringFromVecSequence = (seq) ->
    'M'+(v.x+','+v.y for v in seq).join('L')

# Hand-picked parameters for beautiful-looking scribbles of size DOODLE_SIZE
DOODLE_AMPLITUDE          = 34
DOODLE_SIZE               = 80
DOODLE_JITTER             = 8
DOODLE_ATTRACTOR_STRENGTH = 0.048
DOODLE_DRAG               = 0.05
DOODLE_STEP_DELTA         = 1.0/40
DOODLE_RIBBON_MIN_WIDTH   = 0.01
DOODLE_RIBBON_MAX_WIDTH   = 0.8
DOODLE_COLOR              = '#3c66ba'

###
* Renders an uneven strip from a center line `points`
* @param {Vec[]} points - The array of points representing the middle line
* @param {Number} minWidth  - The minimal width of the ribbon
* @param {Number} maxWidth  - The maximal width of the ribbon
* @result {String} A string representing the brush path description
###
renderStrip = (points, minWidth, maxWidth) ->
    ribbonUp = []
    ribbonDown = []

    doodleRibbonWidth = (maxWidth - minWidth)
    pointsHalfLength = (points.length-1)/2

    for i in [0...points.length]
        # Get the two nearest point to compute the speed
        if i < points.length - 1
            vA = points[i]
            vB = points[i+1]
        else
            # Special case for last vector, we reuse the same speed
            vA = points[i-1]
            vB = points[i]
        # Compute the current ribbon width
        a = minWidth + \
            doodleRibbonWidth * (1.0 - Math.abs(i / pointsHalfLength - 1.0))
        # Normalize the speed, rotate it & scale it by the current width
        uD = vB.sub(vA).perpendicular().normalizeTo(a)
        rU = vA.add(uD)
        rD = vA.sub(uD)
        # Add a point above and a point below the ribbon
        ribbonUp.push(rU)
        ribbonDown.push(rD)

    # The ribbon path is created by following the upward points, then
    # following the downwards points in reverse
    ribbon = ribbonUp.concat(ribbonDown.reverse())
    return pathStringFromVecSequence(ribbon)

##############################################################################
# 8pen representation
##############################################################################
letterToQuadrantSequence =
        'y': '12'
        'b': '123'
        'p': '1234'
        'q': '12341'

        'n': '23'
        'm': '234'
        'f': '2341'
        #'à': '23412'
        'å': '23412'

        'e': '34'
        'l': '341'
        'k': '3412'
        #'é': '34123'
        'æ': '34123'
        'ä': '34123'

        't': '41'
        'c': '412'
        'z': '4123'
        '.': '41234'

        's': '14'
        'd': '143'
        'g': '1432'
        '\'': '14321'
        'ø': '14321'
        'ß': '14321'
        'ö': '14321'

        'a': '21'
        'r': '214'
        'x': '2143'
        '?': '21432'

        'o': '32'
        'u': '321'
        'v': '3214'
        'w': '32143'

        'i': '43'
        'h': '432'
        'j': '4321'
        ',': '43214'

filterWeirdCharacters = do ->
    # All the letters that we can write
    allowedLetters = (l for l, d of letterToQuadrantSequence)

    # Convert accented characters to plain equivalents
    in_chrs   = 'àáâãçèéêëìíîïñòóôõùúûüýÿÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ'
    out_chrs  = 'aaaaceeeeiiiinoooouuuuyyAAAAACEEEEIIIINOOOOOUUUUY'
    chars_rgx = new RegExp('[' + in_chrs + ']', 'g')
    transl    = {}
    lookup    = (m) -> transl[m] || m

    for i in [0...in_chrs.length]
      transl[in_chrs[i]] = out_chrs[i]

    # return the conversion function
    (word) ->
        word = word.trim()
        word = word.toLowerCase()
        word = word.replace chars_rgx, lookup
        word = (l for l in word when allowedLetters.indexOf(l) >= 0).join('')
        return word

# Take a string of words as input and return an array of filtered words
# containing characters that the 8pen doodle can display
filterWords = (words) ->
    words = words.match(/\S+/g) or []
    words = (filterWeirdCharacters(word) for word in words)
    words = words.filter((word) -> word and word.length > 0)
    return words

# Return the word length in terms of the number of quadrants to draw the word
wordQuadrantLength = wordQuadrantLength = (word) ->
    word = filterWeirdCharacters(word)
    length = 0
    for i in [0...word.length]
        l = word[i]
        qSeq = letterToQuadrantSequence[l]
        length += qSeq.length - 1
    return length

# Position of the center point and of each quadrant
quadrantPos = quadrantPos =
    '0': new Vec( 0.0,  0.0)
    '1': new Vec( 0.0, -1.0)
    '2': new Vec( 1.0,  0.0)
    '3': new Vec( 0.0,  1.0)
    '4': new Vec(-1.0,  0.0)

opposedQuadrant = opposedQuadrant =
    '1': '3'
    '2': '4'
    '3': '1'
    '4': '2'

###
* Create a physics state with an attractor describing the motion between
* 8pen sectors, and a pen particle following the attractor
* @param {String} word - The word to display
###
class WordDoodlePhysicsState
    constructor: (@word) ->

    # reinit the physics state to the original state
    reinitPhysics: () ->
        @quadrantSequence = []
        # init the leader particle on the first motion segment, with a little
        # bit of advance
        @tween = 0.4

        centerW = DOODLE_SIZE/2
        @leaderPos = new Vec(centerW, centerW)
        @penPos = new Vec(centerW, centerW)
        @penSpeed = new Vec(0, 0)
        @centerPos = new Vec(centerW, centerW)

        @quadrantSequence = '0' +
            (letterToQuadrantSequence[l] for l in @word).join('0') + '0'

        if @word.length > 0
            # add a small rotation at the start of the first stroke
            # depending on the first turn (ie. the positions of the 2nd & 3rd
            # quadrants)
            qA = +@quadrantSequence[1] # the + casts to an int
            qB = +@quadrantSequence[2]
            isMovingClockwise = (qB - qA + 4) % 4 == 3
            angle = (if isMovingClockwise then 1 else -1) * Math.PI / 4.0
            @penSpeed = quadrantPos[qA].copy()
                .scaleInPlace(0.5)
                .rotateInPlace(angle)

            # we extend the path by adding a line in the direction opposite the
            # last quadrant, to let the particle return to the center
            l = @quadrantSequence[@quadrantSequence.length - 2]
            @quadrantSequence += opposedQuadrant[l]

    # run one step of the doodle simulation
    # returns false if no more letters are to be drawn
    stepPhysics: () ->
        # return true if the simulation should continue, false otherwise
        @tween += DOODLE_STEP_DELTA
        i = Math.floor(@tween)
        fracTween = @tween - i

        if i >= @quadrantSequence.length - 1
            return false

        # if we are starting a new letter, jitter the center
        # this happens if we just moved pass a '0' in the quadrant sequence
        if @quadrantSequence[i] == '0' and fracTween <= DOODLE_STEP_DELTA
            @centerPos.x += (Math.random()-0.5) * DOODLE_JITTER
            @centerPos.y += (Math.random()-0.5) * DOODLE_JITTER

        qA = @quadrantSequence[i]
        qB = @quadrantSequence[i+1]
        vA = quadrantPos[qA].scale(DOODLE_AMPLITUDE)
        vB = quadrantPos[qB].scale(DOODLE_AMPLITUDE)

        # update the position of each particle
        @leaderPos = @centerPos.copy()
            .addInPlace(vA)
            .addInPlace((vB.sub(vA)).scaleInPlace(fracTween))
        f = @leaderPos.copy()
            .subInPlace(@penPos)
            .normalizeToInPlace(DOODLE_ATTRACTOR_STRENGTH)
        @penSpeed.addInPlace(f).scaleInPlace(1 - DOODLE_DRAG)
        @penPos.addInPlace(@penSpeed)

        return true

    # compute the doodle centerline:
    #  - reinit the physics
    #  - step the simulation until it ends
    #  - store successive positions in an array
    getPoints: () ->
        # Reinitialize the random number generator to have consistent shapes
        Math.seedrandom('8pen')
        @reinitPhysics()
        # Simulate the 8pen while there is still a letter that has to be traced
        penPosArray = []
        while @stepPhysics()
            # while there are still letters to draw
            penPosArray.push(new Vec(@penPos))
        return penPosArray

###
* Center & rescale the doodle centerline to fit in a width * width square
###
getDoodleCenterLine = (word, width) ->
    # Get the doodle center line and rescale it to fit in a square of width size
    penPosArray = new WordDoodlePhysicsState(word)
        .getPoints()

    if penPosArray.length > 0
        # define the bounding-box
        bb_A = new Vec(penPosArray[0])
        bb_B = new Vec(penPosArray[0])
        update_bb_p = (p) ->
            bb_A.x = Math.min(bb_A.x, p.x)
            bb_A.y = Math.min(bb_A.y, p.y)
            bb_B.x = Math.max(bb_B.x, p.x)
            bb_B.y = Math.max(bb_B.y, p.y)
        update_bb_p(p) for p in penPosArray

        # Compute the scaling transform
        bb_diag = bb_B.sub(bb_A)
        v_disp = new Vec(DOODLE_SIZE, DOODLE_SIZE)
            .subInPlace(bb_diag)
            .scaleInPlace(0.5)
            .subInPlace(bb_A)

        scale = width / DOODLE_SIZE
        normalize_p = (p) -> p.addInPlace(v_disp).scaleInPlace(scale)

        return (normalize_p(p) for p in penPosArray)
    else
        return []

##############################################################################
# Figure -- 8pen ribbon
##############################################################################
window.DoodleAnimation = class DoodleAnimation
    constructor: (@id) ->
        parent = d3.select(@id)

        container = parent.append('div')
            .style('position', 'relative')

        @svg = container.append('svg:svg')
            .attr('class', 'figure')
            .attr('viewBox', "0 0 #{DOODLE_SIZE} #{DOODLE_SIZE}")
            .style('width', '100%')
            .style('height', '100%')

        @doodle = @svg.append('svg:g')

        @pathEl = @doodle.append('svg:path')
            .style('fill', DOODLE_COLOR)
            .style('stroke', 'none')
            .style('opacity', '0.8')

        @player = new PausablePlayer(@animationCallback)
        @svg.on('click', @onClick)

    onClick: () =>
        d3.event.preventDefault()
        @play() if @word

    play: () =>
        return unless @word
        @player.stop()
        quadrantLength = wordQuadrantLength(@word)
        duration = Math.min(1.4, Math.max(quadrantLength/8.0, 0.4))
        @speed = Math.ceil(@frameNumber / (duration * 1000))
        animationData =
            f: 1
        @player.play(animationData)
        return this

    showLastFrame: () =>
        return unless @word
        @player.stop()
        @renderFrame(-1)

    renderFrame: (frame) ->
        return unless @word
        while frame < 0
            frame += @frameNumber
        points = @penPosArray.slice(0, frame + 1)
        @pathEl.attr('d', renderStrip(points, DOODLE_RIBBON_MIN_WIDTH, DOODLE_RIBBON_MAX_WIDTH))

    setWord: (@word) =>
        # Filter non displayable characters
        words = filterWords(@word)
        # Ensure that there is a word if @word has no displayable characters
        words = ['hello'] if words.length == 0
        # Only display the first word
        @word = words[0]
        @player.stop()
        @penPosArray = getDoodleCenterLine(@word, DOODLE_SIZE, @parameters)
        @frameNumber = @penPosArray.length
        return this

    animationCallback: (dt, data) =>
        f = Math.floor(data.f)
        if f >= @frameNumber
            @showLastFrame()
            return 'S' # show last frame & stop
        else
            @renderFrame(f)
        data.f += @speed*dt
        return 'P' # continue playing
