const React = Zotero.getMainWindow().require('react')
const { useState, useEffect, useRef, useCallback, useReducer, useMemo, useImperativeHandle, createContext } = React

module.exports = React
exports.useState = useState
exports.useEffect = useEffect
exports.useRef = useRef
exports.useCallback = useCallback
exports.useReducer = useReducer
exports.useMemo = useMemo
exports.useImperativeHandle = useImperativeHandle
exports.createContext = createContext