import _ from 'lodash';

export const runRobots = (inputString) => {
  return _.reduce(parseLines(inputString), (state, line) => {
    switch (state.mode) {
      case 'dimensions': return readDimensions(line, state);
      case 'position': return readPosition(line, state);
      case 'commands': return readCommands(line, state);
    }
  }, {
    mode: 'dimensions',
    losts: [],
    out: ''
  }).out;
}

const readDimensions = (s, state) => {
  const match = /^(\d+) (\d+)$/.exec(s);
  return match
    ? _.assign(state, {
      mode: 'position',
      dim: {
        w: parseInt(match[1], 10),
        h: parseInt(match[2], 10)
      }
    })
    : parseError(`Dimensions: ${s}`);
}

const readPosition = (s, state) => {
  const match = /^(\d+) (\d+) ([NESW])$/.exec(s);
  return match
    ? _.assign(state, {
      mode: 'commands',
      pos: {
        x: parseInt(match[1], 10),
        y: parseInt(match[2], 10),
        d: match[3]
      }
    })
    : parseError(`Position: ${s}`);
}

const readCommands = (s, state) => {
  const match = /^[LRF]*$/.exec(s);
  return match
    ? (() => {
      const cmds  = parseCommands(s)
      const pos   = runCommands(cmds, state.dim, state.pos, state.losts);
      const losts = pos.lost ? state.losts.concat(pos) : state.losts;
      const out   = renderOut(state.out, pos)

      return _.assign(state, {
         mode: 'position',
         losts,
         out
      });
    })()
    : parseError(`Commands: ${s}`);
}

const runCommands = (cmds, dim, pos, losts) => {
  return _.reduce(cmds, (pos, cmd) => {
    if (pos.lost) return pos;

    const newPos = !isPreviouslyLost(pos, cmd, losts)
      ? directionCommands[pos.d][cmd](pos)
      : pos;

    return isOutOfBounds(newPos, dim)
      ? _.assign(pos, { lost: true, cmd: cmd })
      : newPos;
  }, pos);
}

const parseLines = (inputString) =>
  inputString ? _.filter(inputString.split('\n'), _.negate(_.isEmpty)) : [];

const parseCommands = (inputString) =>
  inputString ? _.filter(inputString.split(''), _.negate(_.isEmpty)) : [];

const isOutOfBounds = ({x, y, d}, {w, h}) =>
  x < 0 || x > w || y < 0 || y > h;

const isPreviouslyLost = ({x, y, d}, cmd, losts) =>
  _.some(losts, p => x == p.x && y == p.y && d == p.d && cmd == p.cmd);

const renderOut = (out, p) =>
  `${out}${p.x} ${p.y} ${p.d}${p.lost ? ' LOST' : ''}\n`

const parseError = (message) => {
  throw new Error(`Parse error: ${message}`);
}

const directionCommands = {
  N: {
    L: ({x, y}) => ({x, y, d: 'W'}),
    R: ({x, y}) => ({x, y, d: 'E'}),
    F: ({x, y, d}) => ({x, y: y+1, d})
  },
  E: {
    L: ({x, y}) => ({x, y, d: 'N'}),
    R: ({x, y}) => ({x, y, d: 'S'}),
    F: ({x, y, d}) => ({x: x+1, y, d})
  },
  S: {
    L: ({x, y}) => ({x, y, d: 'E'}),
    R: ({x, y}) => ({x, y, d: 'W'}),
    F: ({x, y, d}) => ({x, y: y-1, d})
  },
  W: {
    L: ({x, y}) => ({x, y, d: 'S'}),
    R: ({x, y}) => ({x, y, d: 'N'}),
    F: ({x, y, d}) => ({x: x-1, y, d})
  },
}
