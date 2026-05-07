/* global av */
(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search || '');
  if (params.get('avidaTest') !== '1' && params.get('test') !== '1') {
    return;
  }

  var state = {
    installed: false,
    messages: [],
    errors: []
  };

  function recordError(error) {
    state.errors.push({
      message: error && error.message ? error.message : String(error),
      stack: error && error.stack ? error.stack : ''
    });
  }

  window.addEventListener('error', function (event) {
    recordError(event.error || event.message);
  });

  window.addEventListener('unhandledrejection', function (event) {
    recordError(event.reason);
  });

  function waitFor(predicate, timeoutMs) {
    var timeout = timeoutMs || 10000;
    var start = Date.now();
    return new Promise(function (resolve, reject) {
      function check() {
        try {
          var value = predicate();
          if (value) {
            resolve(value);
            return;
          }
        } catch (error) {
          reject(error);
          return;
        }
        if (Date.now() - start >= timeout) {
          reject(new Error('Timed out waiting for Avida test condition'));
          return;
        }
        window.setTimeout(check, 25);
      }
      check();
    });
  }

  function installMessageHook() {
    if (state.installed) {
      return true;
    }
    if (!window.av || !av.msg || typeof av.msg.readMsg !== 'function') {
      return false;
    }

    var readMsg = av.msg.readMsg;
    av.msg.readMsg = function (event) {
      if (event && event.data) {
        state.messages.push(event.data);
      }
      return readMsg.apply(this, arguments);
    };
    state.installed = true;
    return true;
  }

  function waitForWorker(timeoutMs) {
    return waitFor(function () {
      return installMessageHook() && window.av && av.aww && av.aww.uiWorker;
    }, timeoutMs);
  }

  function send(message) {
    if (!window.av || !av.aww || !av.aww.uiWorker) {
      throw new Error('Avida UI worker is not available');
    }
    av.aww.uiWorker.postMessage(message);
  }

  function sendData() {
    send({ type: 'sendData' });
  }

  function waitForMessage(predicate, timeoutMs) {
    return waitFor(function () {
      for (var ii = 0; ii < state.messages.length; ii += 1) {
        if (predicate(state.messages[ii])) {
          return state.messages[ii];
        }
      }
      return false;
    }, timeoutMs);
  }

  function waitForReady(timeoutMs) {
    return waitForWorker(timeoutMs).then(function () {
      return waitForMessage(function (message) {
        return message &&
          message.type === 'userFeedback' &&
          message.level === 'notification' &&
          typeof message.message === 'string' &&
          message.message.indexOf('ready') === 0;
      }, timeoutMs);
    });
  }

  function clearMessages() {
    state.messages.length = 0;
  }

  function importExpression(files) {
    send({
      type: 'addEvent',
      name: 'importExpr',
      triggerType: 'immediate',
      files: files
    });
    sendData();
  }

  window.avidaTest = {
    state: state,
    clearMessages: clearMessages,
    importExpression: importExpression,
    send: send,
    sendData: sendData,
    waitFor: waitFor,
    waitForMessage: waitForMessage,
    waitForReady: waitForReady,
    waitForWorker: waitForWorker
  };
}());
