"use strict";

var babelTemplate = require('babel-template');
var buildRequireMethod = babelTemplate([
    'function NAME(obj) {',
        'return obj && obj.__esModule ? obj.default : obj;',
    '}'
].join('\n'));

exports.__esModule = true;

exports.default = function (_ref) {
    var t = _ref.types;

    // from babel-plugin-transform-es2015-modules-amd
    function isValidRequireCall(path) {
        if (!path.isCallExpression()) return false;
        if (!path.get("callee").isIdentifier({ name: "require" })) return false;
        // if (path.scope.getBinding("require")) return false;

        var args = path.get("arguments");
        if (args.length !== 1) return false;

        var arg = args[0];
        if (!arg.isStringLiteral()) return false;

        return true;
    }
    function isGlobalRequireCall(path) {
        if (!path.isCallExpression()) return false;
        if (!path.get("callee").isIdentifier({ name: "require" })) return false;
        // if (path.scope.getBinding("require")) return false;

        var args = path.get("arguments");
        if (args.length <= 1) return false;
        return true;
    }

    function turnRequire(target) {
        // return t.MemberExpression(
        //     target,
        //     t.identifier('default')
        // );
        return t.callExpression(
            t.identifier('_interopRequireDefault'),
            [target]
        );
    }

    var amdVisitor = {
        CallExpression: function CallExpression(path) {
            if (isValidRequireCall(path)) {
                let parentKey = path.parentKey;
                switch (parentKey) {
                    case 'arguments':
                    case 'elements':
                        path.parent[path.parentKey][path.key] = turnRequire(path.parent[path.parentKey][path.key]);
                        path.node = path.parent[path.parentKey][path.key];
                        break;
                    default:
                        path.parent[path.parentKey] = turnRequire(path.parent[path.parentKey]);
                        path.node = path.parent[path.parentKey];
                        break;
                }
            }
            // else if (isGlobalRequireCall(path)) {
            //     //
            // }
        }
    }

    return {
        inherits: require("babel-plugin-transform-es2015-modules-commonjs"),

        pre: function pre() {
            
        },

        visitor: {
            Program: {
                exit: function exit(path) {
                    var _this = this;

                    if (this.ran) {
                        return;
                    }
                    this.ran = true;

                    // var node = path.node;
                    let needContinue = makeDefineModuleOK(path);
                    if (!needContinue) {
                        return;
                    }
                    // 遍历查找 require
                    path.traverse(amdVisitor, this);
                    // mainFunc 的 return
                    var mainFunc = getDefineFunction(path);
                    var returnStatement = getReturnStatement(mainFunc);
                    if (returnStatement && returnStatement.target) {
                        mainFunc.body.body.splice(
                            returnStatement.index, 0,
                            t.VariableDeclaration('var', [
                                t.VariableDeclarator(t.identifier('__esModuleAMDExport'), t.objectExpression(
                                    [
                                        t.objectProperty(t.identifier('default'), returnStatement.target.argument),
                                        t.objectProperty(t.identifier('__esModule'), t.booleanLiteral(true))
                                    ]
                                ))
                            ])
                        );
                        returnStatement.target.argument = t.identifier('__esModuleAMDExport');
                    }

                    // 差一个 _interopRequireDefault 进去
                    mainFunc.body && mainFunc.body.body && mainFunc.body.body.push(
                        buildRequireMethod({
                            NAME: t.identifier('_interopRequireDefault')
                        })
                    );
                }
            }
        }
    };
};

function isDefineCallExpression(node) {
    return (
        node
        && node.type === 'ExpressionStatement'
        && node.expression.type === 'CallExpression'
        && node.expression.callee.name === 'define'
    );
}
// 修正了babel-plugin-transform-es2015-modules-amd导致的双层define的问题
function makeDefineModuleOK(path) {
    var body = path.node.body;
    if (body.length === 1  // 只有一个调用
        && isDefineCallExpression(body[0])) {
        // 最外层就是个 define 了，试探一下下面是否还包了一个，如果是，则撤回成这个define
        var argLen = body[0].expression.arguments.length;
        var toCheck = body[0].expression.arguments[argLen - 1];
        if (toCheck.type === 'FunctionExpression'
            && isDefineCallExpression(toCheck.body.body[toCheck.body.body.length - 1])) {
            // 之前的处理可能会加上一段var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbo之类的
            // 还得在里面
            // fallback
            var toInsert = null;
            if (toCheck.body.body.length > 1) {
                toInsert = toCheck.body.body.slice(0, toCheck.body.body.length - 1);
            }
            path.node.body = [toCheck.body.body[toCheck.body.body.length - 1]];
            if (toInsert && toInsert.length > 0) {
                path.node.body[0].expression.arguments[path.node.body[0].expression.arguments.length - 1].body.body = [].concat(
                    toInsert,
                    path.node.body[0].expression.arguments[path.node.body[0].expression.arguments.length - 1].body.body
                );
            }
            return true;
        }
    }
    return false;
}
function getDefineFunction(path) {
    if (isDefineCallExpression(path.node.body[0])) {
        return path.node.body[0].expression.arguments[path.node.body[0].expression.arguments.length - 1];
    }
}
function getReturnStatement(path) {
    if (path && path.type === 'FunctionExpression') {
        var target = null;
        var index = 0;
        for (index = path.body.body.length - 1; index >=0 ; index--) {
            if (path.body.body[index].type === 'ReturnStatement') {
                target = path.body.body[index];
                break;
            }
        }
        return {
            target: target,
            index: index
        };
    }
}

module.exports = exports["default"];