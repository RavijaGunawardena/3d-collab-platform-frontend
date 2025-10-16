import React, { useState, useEffect } from "react";

// Debug component to test socket connection and events
const SocketDebugger = () => {
  const [logs, setLogs] = useState([]);
  const [socketStatus, setSocketStatus] = useState("disconnected");
  const [envVars, setEnvVars] = useState({});
  const [testResults, setTestResults] = useState({});

  const addLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  // Check environment variables
  useEffect(() => {
    const env = {
      VITE_API_URL: import.meta.env.VITE_API_URL,
      VITE_SOCKET_URL: import.meta.env.VITE_SOCKET_URL,
      VITE_ENABLE_LOGGING: import.meta.env.VITE_ENABLE_LOGGING,
      NODE_ENV: import.meta.env.NODE_ENV,
      DEV: import.meta.env.DEV,
      PROD: import.meta.env.PROD,
    };
    setEnvVars(env);
    addLog(`Environment variables loaded: ${JSON.stringify(env)}`);
  }, []);

  // Test API connectivity
  const testAPI = async () => {
    addLog("Testing API connectivity...", "info");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/socket-health`
      );
      const data = await response.json();
      addLog(`✅ API connected: ${JSON.stringify(data)}`, "success");
      setTestResults((prev) => ({ ...prev, api: true }));
    } catch (error) {
      addLog(`❌ API connection failed: ${error.message}`, "error");
      setTestResults((prev) => ({ ...prev, api: false }));
    }
  };

  // Test Socket.IO direct connection
  const testDirectSocket = async () => {
    addLog("Testing direct Socket.IO connection...", "info");

    try {
      // Dynamic import to avoid build issues
      const { io } = await import("socket.io-client");
      const socketUrl =
        import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

      addLog(`Connecting to: ${socketUrl}`, "info");

      const socket = io(socketUrl, {
        transports: ["websocket", "polling"],
        timeout: 10000,
        forceNew: true,
      });

      socket.on("connect", () => {
        addLog(`✅ Direct socket connected! ID: ${socket.id}`, "success");
        setSocketStatus("connected");
        setTestResults((prev) => ({ ...prev, socket: true }));

        // Test project join
        testProjectJoin(socket);
      });

      socket.on("connect_error", (error) => {
        addLog(`❌ Direct socket connection error: ${error.message}`, "error");
        setSocketStatus("error");
        setTestResults((prev) => ({ ...prev, socket: false }));
      });

      socket.on("disconnect", (reason) => {
        addLog(`🔌 Direct socket disconnected: ${reason}`, "warning");
        setSocketStatus("disconnected");
      });

      // Cleanup after 30 seconds
      setTimeout(() => {
        socket.disconnect();
        addLog("Direct socket test completed", "info");
      }, 30000);
    } catch (error) {
      addLog(`❌ Failed to create direct socket: ${error.message}`, "error");
      setTestResults((prev) => ({ ...prev, socket: false }));
    }
  };

  // Test project join
  const testProjectJoin = (socket) => {
    addLog("Testing project:join event...", "info");

    const testData = {
      projectId: "test-project-123",
      token: "fake-jwt-token-for-testing",
    };

    addLog(
      `Emitting project:join with data: ${JSON.stringify(testData)}`,
      "info"
    );

    socket.emit("project:join", testData, (response) => {
      addLog(
        `📥 project:join response received: ${JSON.stringify(response)}`,
        "success"
      );
      setTestResults((prev) => ({ ...prev, projectJoin: true }));
    });

    // Set timeout to check if callback is received
    setTimeout(() => {
      addLog("⏰ Checking if project:join callback was received...", "warning");
    }, 5000);
  };

  // Test socket manager (if available)
  const testSocketManager = async () => {
    addLog("Testing socket manager...", "info");

    try {
      // Try different import paths
      const importPaths = [
        "@/lib/socket",
        "@/services/socket",
        "./socket",
        "../socket",
      ];

      for (const path of importPaths) {
        try {
          const socketModule = await import(path);
          const socketManager =
            socketModule.default || socketModule.socketManager;

          if (socketManager) {
            addLog(`✅ Found socket manager at: ${path}`, "success");

            // Test connection
            const socket = socketManager.connect();
            addLog(
              `Socket manager status: ${socketManager.getStatus()}`,
              "info"
            );
            addLog(
              `Socket manager connected: ${socketManager.isConnected()}`,
              "info"
            );

            return;
          }
        } catch (e) {
          addLog(`❌ Failed to import from ${path}: ${e.message}`, "error");
        }
      }

      addLog("❌ Could not find socket manager", "error");
    } catch (error) {
      addLog(`❌ Socket manager test failed: ${error.message}`, "error");
    }
  };

  // Test browser network connectivity
  const testNetworkConnectivity = async () => {
    addLog("Testing network connectivity...", "info");

    const testUrls = [
      `${import.meta.env.VITE_API_URL}/socket-health`,
      `${import.meta.env.VITE_SOCKET_URL}/socket.io/socket.io.js`,
      "http://localhost:5000/socket-health",
      "http://localhost:5000/socket.io/socket.io.js",
    ];

    for (const url of testUrls) {
      try {
        const response = await fetch(url, { method: "HEAD" });
        addLog(`✅ ${url} - Status: ${response.status}`, "success");
      } catch (error) {
        addLog(`❌ ${url} - Error: ${error.message}`, "error");
      }
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setLogs([]);
    setTestResults({});
    addLog("🔬 Starting comprehensive socket debug tests...", "info");

    await testAPI();
    await testNetworkConnectivity();
    await testSocketManager();
    await testDirectSocket();
  };

  const clearLogs = () => {
    setLogs([]);
    setTestResults({});
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Socket.IO Debug Panel</h2>

      {/* Environment Info */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h3 className="text-lg font-semibold mb-2">Environment Variables</h3>
        <pre className="text-sm overflow-x-auto">
          {JSON.stringify(envVars, null, 2)}
        </pre>
      </div>

      {/* Test Results */}
      <div className="mb-6 p-4 bg-blue-50 rounded">
        <h3 className="text-lg font-semibold mb-2">Test Results</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            className={`p-2 rounded ${
              testResults.api ? "bg-green-200" : "bg-red-200"
            }`}
          >
            API: {testResults.api ? "✅" : "❌"}
          </div>
          <div
            className={`p-2 rounded ${
              testResults.socket ? "bg-green-200" : "bg-red-200"
            }`}
          >
            Socket: {testResults.socket ? "✅" : "❌"}
          </div>
          <div
            className={`p-2 rounded ${
              testResults.projectJoin ? "bg-green-200" : "bg-red-200"
            }`}
          >
            Project Join: {testResults.projectJoin ? "✅" : "❌"}
          </div>
          <div
            className={`p-2 rounded ${
              socketStatus === "connected" ? "bg-green-200" : "bg-red-200"
            }`}
          >
            Status: {socketStatus}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 space-x-2">
        <button
          onClick={runAllTests}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Run All Tests
        </button>
        <button
          onClick={testAPI}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Test API
        </button>
        <button
          onClick={testDirectSocket}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Test Socket
        </button>
        <button
          onClick={clearLogs}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear Logs
        </button>
      </div>

      {/* Logs */}
      <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
        <h3 className="text-white mb-2">Debug Logs:</h3>
        {logs.map((log, index) => (
          <div
            key={index}
            className={`mb-1 ${
              log.type === "error"
                ? "text-red-400"
                : log.type === "success"
                ? "text-green-400"
                : log.type === "warning"
                ? "text-yellow-400"
                : "text-blue-400"
            }`}
          >
            [{log.timestamp}] {log.message}
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-gray-500">
            Click "Run All Tests" to start debugging...
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-yellow-50 rounded">
        <h3 className="text-lg font-semibold mb-2">Debug Instructions</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Click "Run All Tests" to diagnose all issues</li>
          <li>Check that your backend server is running on port 5000</li>
          <li>Verify environment variables are correct</li>
          <li>Look for specific error messages in the logs</li>
          <li>Test individual components if needed</li>
        </ol>
      </div>
    </div>
  );
};

export default SocketDebugger;
