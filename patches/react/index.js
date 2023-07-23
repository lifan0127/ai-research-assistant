const React = Zotero.getMainWindow().require('react')
const { useState, useEffect, useRef, useReducer, useMemo, createContext } = React

module.exports = React
exports.useState = useState
exports.useEffect = useEffect
exports.useRef = useRef
exports.useReducer = useReducer
exports.useMemo = useMemo
exports.createContext = createContext