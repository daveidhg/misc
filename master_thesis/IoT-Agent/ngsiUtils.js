/*
 * Copyright 2014 Telefonica Investigación y Desarrollo, S.A.U
 *
 * This file is part of fiware-iotagent-lib
 *
 * fiware-iotagent-lib is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * fiware-iotagent-lib is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with fiware-iotagent-lib.
 * If not, see http://www.gnu.org/licenses/.
 *
 * For those usages not covered by the GNU Affero General Public License
 * please contact with::[contacto@tid.es]
 */

/* eslint-disable no-unused-vars */

const async = require('async');
const errors = require('../../errors');
const logger = require('logops');
const intoTrans = require('../common/domain').intoTrans;
const context = {
    op: 'IoTAgentNGSI.NGSIUtils'
};
const _ = require('underscore');
const config = require('../../commonConfig');
const { request } = require('iotagent-node-lib');
const updateMiddleware = [];
const queryMiddleware = [];

/**
 * @param      {String/Array}   value       Comma separated list or array of values
 * @return     {Array}                      Array of Lat/Lngs for use as GeoJSON
 */
function splitLngLat(value) {
    const lngLats = typeof value === 'string' || value instanceof String ? value.split(',') : value;
    lngLats.forEach((element, index, lngLats) => {
        if (Array.isArray(element)) {
            lngLats[index] = splitLngLat(element);
        } else if ((typeof element === 'string' || element instanceof String) && element.includes(',')) {
            lngLats[index] = splitLngLat(element);
        } else {
            lngLats[index] = Number.parseFloat(element);
        }
    });
    return lngLats;
}

/**
 * @param      {String}   type        GeoJSON
 * @param      {String}   value       Value to be analyzed
 * @return     {Array}                split pairs of GeoJSON coordinates
 */
function getLngLats(type, value) {
    if (typeof value !== 'string' && Array.isArray(value) === false) {
        return value;
    }

    const lngLats = _.flatten(splitLngLat(value));
    if (lngLats.length === 2) {
        return { type, coordinates: lngLats };
    }

    if (lngLats.length % 2 !== 0) {
        logger.error(context, 'Bad attribute value type. Expecting geo-coordinates. Received:%s', value);
        throw Error();
    }
    const arr = [];
    for (let i = 0, len = lngLats.length; i < len; i = i + 2) {
        arr.push([lngLats[i], lngLats[i + 1]]);
    }
    return { type, coordinates: arr };
}

/**
 * Determines if a value is of type float
 *
 * @param      {String}   value       Value to be analyzed
 * @return     {boolean}              True if float, False otherwise.
 */
function isFloat(value) {
    return !isNaN(value) && value.toString().indexOf('.') !== -1;
}

async function getAccessToken() {
    const params = new URLSearchParams();
    params.append("grant_type", "vp_token");
    params.append("vp_token", config.getConfig().contextBroker.VP_token);
    params.append("scope", "default")
    const response = await fetch(config.getConfig().contextBroker.access_token_host, {
            method: 'POST',
            body: params,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': '*/*',
                'User-Agent': 'curl/8.11.0' //server does not like node?
            }
        })
    const json = await response.json();
    return 'Bearer ' + json["access_token"];
}

/**
 * Create the request object used to communicate with the Context Broker, adding security and service information.
 *
 * @param {String} url                  Path for the Context Broker operation.
 * @param {Object} typeInformation      Object containing information about the device: service, security, etc.
 * @param {String} token                If present, security information needed to access the CB.
 * @return {Object}                    Containing all the information of the request but the payload.c
 */
async function createRequestObject(url, typeInformation, token) {
    let cbHost = config.getConfig().contextBroker.url;

    const serviceContext = {};
    const headers = {
        'fiware-service': config.getConfig().service,
        'fiware-servicepath': config.getConfig().subservice
    };

    if (config.getConfig().contextBroker.authentication === 'manual') {
        cbHost = config.getConfig().contextBroker.PEP_host;
        headers['Authorization'] = 'Bearer ' + config.getConfig().contextBroker.access_token;
    }

    else if (config.getConfig().contextBroker.authentication === 'auto') {
        cbHost = config.getConfig().contextBroker.PEP_host;
        headers['Authorization'] = await getAccessToken();
    }

    if (config.getConfig().authentication && config.getConfig().authentication.enabled) {
        headers[config.getConfig().authentication.header] = token;
    }
    logger.debug(context, 'typeInformation %j', typeInformation);
    if (typeInformation) {
        if (typeInformation.service) {
            headers['fiware-service'] = typeInformation.service;
            serviceContext.service = typeInformation.service;
        }

        if (typeInformation.subservice) {
            headers['fiware-servicepath'] = typeInformation.subservice;
            serviceContext.subservice = typeInformation.subservice;
        }

        if (typeInformation.cbHost && typeInformation.cbHost.indexOf('://') !== -1) {
            cbHost = typeInformation.cbHost;
        } else if (typeInformation.cbHost && typeInformation.cbHost.indexOf('://') === -1) {
            cbHost = 'http://' + typeInformation.cbHost;
        }
    }

    if (config.checkNgsiLD(typeInformation)) {
        headers['Content-Type'] = 'application/json';
        //headers['NGSILD-Tenant'] = headers['fiware-service'];
        //headers['NGSILD-Path'] = headers['fiware-servicepath'];
    }

    const options = {
        url: cbHost + url,
        method: 'POST',
        headers
    };

    return intoTrans(serviceContext, function () {
        return options;
    })();
}

function applyMiddlewares(middlewareCollection, entity, typeInformation, callback) {
    function emptyMiddleware(callback) {
        callback(null, entity, typeInformation);
    }

    function endMiddleware(entity, typeInformation, callback) {
        callback(null, entity);
    }

    if (middlewareCollection && middlewareCollection.length > 0) {
        const middlewareList = _.clone(middlewareCollection);

        middlewareList.unshift(emptyMiddleware);
        middlewareList.push(endMiddleware);

        async.waterfall(middlewareList, callback);
    } else {
        callback(null, entity);
    }
}

function getMetaData(typeInformation, name, metadata) {
    if (metadata) {
        return metadata;
    }

    let i;
    if (typeInformation.active) {
        for (i = 0; i < typeInformation.active.length; i++) {
            /* jshint camelcase: false */
            if (name === typeInformation.active[i].object_id) {
                return typeInformation.active[i].metadata;
            }
        }
    }
    if (typeInformation.lazy) {
        for (i = 0; i < typeInformation.lazy.length; i++) {
            /* jshint camelcase: false */
            if (name === typeInformation.lazy[i].object_id) {
                return typeInformation.lazy[i].metadata;
            }
        }
    }
    if (typeInformation.staticAttributes) {
        for (i = 0; i < typeInformation.staticAttributes.length; i++) {
            if (name === typeInformation.staticAttributes[i].name) {
                return typeInformation.staticAttributes[i].metadata;
            }
        }
    }
    return undefined;
}

exports.createRequestObject = createRequestObject;
exports.applyMiddlewares = applyMiddlewares;
exports.getMetaData = getMetaData;
exports.getLngLats = getLngLats;
exports.isFloat = isFloat;
exports.updateMiddleware = updateMiddleware;
exports.queryMiddleware = queryMiddleware;
