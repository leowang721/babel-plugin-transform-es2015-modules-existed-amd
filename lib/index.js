"use strict";

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

    var amdVisitor = {
        CallExpression: function CallExpression(path) {
            if (isValidRequireCall(path)) {
                switch (path.parent.type) {
                    // 这里是 var a = require('a'); 这种
                    case 'VariableDeclarator':
                        path.parent.init = t.MemberExpression(
                            path.parent.init,
                            t.identifier('default')
                        );
                        path.node = path.parent.init;
                        break;
                    // 这里是 require('a').b
                    case 'MemberExpression':
                        path.parent.object = t.MemberExpression(
                            path.parent.object,
                            t.identifier('default')
                        );
                        path.node = path.parent.object;
                        break;
                    // 这里是 require('a');
                    // case 'ExpressionStatement':
                    //     path.parent.expression = t.MemberExpression(
                    //         path.parent.expression,
                    //         t.identifier('default')
                    //     );
                    //     path.node = path.parent.expression;
                    //     break;
                    // 这里是 require('a')();
                    case 'CallExpression':
                        path.parent.callee = t.MemberExpression(
                            path.parent.callee,
                            t.identifier('default')
                        );
                        path.node = path.parent.expression;
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
                    makeDefineModuleOK(path);
                    // 遍历查找 require
                    path.traverse(amdVisitor, this);
                    // mainFunc 的 return
                    var mainFunc = getDefineFunction(path);
                    var returnStatement = getReturnStatement(mainFunc);
                    if (returnStatement.target) {
                        mainFunc.body.body.splice(
                            returnStatement.index, 0,
                            t.VariableDeclaration('var', [
                                t.VariableDeclarator(t.identifier('__esModuleAMDExport'), t.objectExpression(
                                    [t.objectProperty(t.identifier('default'), returnStatement.target.argument)]
                                ))
                            ])
                        );
                        returnStatement.target.argument = t.identifier('__esModuleAMDExport');
                    }
                }
            }
        }
    };
};

function isDefineCallExpression(node) {
    return (
        node.type === 'ExpressionStatement'
        && node.expression.type === 'CallExpression'
        && node.expression.callee.name === 'define'
    );
}
// 修正了babel-plugin-transform-es2015-modules-amd导致的双层define的问题
function makeDefineModuleOK(path) {
    var body = path.node.body;
    if (body.length === 1  // 只有一个调用
        && isDefineCallExpression(body[0])) {
        // 最外层就是个 define 了，试探一下下面是否包了一个，如果是，则撤回成这个define
        var argLen = body[0].expression.arguments.length;
        if (body[0].expression.arguments[1].body.body.length === 1
            && isDefineCallExpression(body[0].expression.arguments[1].body.body[0])) {
            // fallback
            path.node.body = body[0].expression.arguments[1].body.body;
        }
    }
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
        for (index = path.body.body.length - 1; index >= 0; index--) {
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