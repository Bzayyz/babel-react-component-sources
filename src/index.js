const core = require('@babel/core');
const ATTRID = '__source';
const FILE_NAME_TAG = '_jsxFileName';

function makeTrace(fileNameIdentifier, { line, column }, componentName) {
  return core.template.expression.ast`{
        fileName: ${fileNameIdentifier},
        lineNumber: ${createNode(line, core.types.numericLiteral)},
        columnNumber: ${createNode(column, c =>
          core.types.numericLiteral(c + 1),
        )},
        componentName:${createNode(componentName, c => {
          if ((typeof c === 'string' || c instanceof String) && c !== '') {
            return core.types.stringLiteral(c || '');
          } else return core.types.nullLiteral();
        })}
      }`;
}

const hasSource = at =>
  core.types.isJSXAttribute(at) && at.name.name === ATTRID;

const createNode = (v, f) => (v === null ? core.types.nullLiteral() : f(v));

module.exports = () => ({
  visitor: {
    JSXOpeningElement(path, state) {
      const { node } = path;
      if (!node.loc || node.attributes.some(hasSource)) {
        return;
      }
      if (!state.fileNameIdentifier) {
        const fileNameId = path.scope.generateUidIdentifier(FILE_NAME_TAG);
        state.fileNameIdentifier = fileNameId;
        path.scope.getProgramParent().push({
          id: fileNameId,
          init: core.types.stringLiteral(state.filename || ''),
        });
      }
      node.attributes.push(
        core.types.jsxAttribute(
          core.types.jsxIdentifier(ATTRID),
          core.types.jsxExpressionContainer(
            makeTrace(
              core.types.cloneNode(state.fileNameIdentifier),
              node.loc.start,
              node?.name?.name,
            ),
          ),
        ),
      );
    },
  },
});
