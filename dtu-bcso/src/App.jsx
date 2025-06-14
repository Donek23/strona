import React, { useState } from "react";

function App() {
  // Stan logowania
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Użytkownicy
  const users = [
    { username: "BCSO", password: "445566", role: "user" },
    { username: "Miasto", password: "Miasto22", role: "user" },
    { username: "JohnPepe", password: "449449", role: "admin" }
  ];

  // Zakładki
  const [activeTab, setActiveTab] = useState("podejrzani");
  const [searchQuery, setSearchQuery] = useState("");

  // Dane użytkownika
  const [entries, setEntries] = useState({
    podejrzani: [],
    pojazdy: [],
    raporty: []
  });

  const [nodes, setNodes] = useState([]);
  const [selectedNodes, setSelectedNodes] = useState([]);

  // Historia zmian (dla admina)
  const [changeHistory, setChangeHistory] = useState([]);

  // Funkcja logowania
  const handleLogin = () => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setIsLoggedIn(true);
    } else {
      alert("Nieprawidłowy login lub hasło");
    }
  };

  // Zapisywanie danych z backupem
  const saveData = (category, data) => {
    const updated = { ...entries, [category]: data };
    setEntries(updated);
    localStorage.setItem("dtu-bcso-data", JSON.stringify(updated));
    logChange("update", `Zaktualizowano dane w "${category}"`);
  };

  // Dodawanie wpisów
  const [inputValue, setInputValue] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);

  const handleSaveEntry = (category) => {
    if (!inputValue.trim()) return;

    const newItem = {
      id: Date.now(),
      text: inputValue,
      date: new Date().toLocaleString()
    };

    const updated = [...(entries[category] || []), newItem];
    saveData(category, updated);
    setInputValue("");
  };

  const handleEditEntry = (category, index) => {
    const entry = entries[category][index];
    setInputValue(entry.text);
    setEditingIndex(index);
  };

  const handleUpdateEntry = (category) => {
    if (!inputValue.trim()) return;
    const updated = [...entries[category]];
    updated[editingIndex].text = inputValue;
    updated[editingIndex].lastEdited = new Date().toLocaleString();
    saveData(category, updated);
    setInputValue("");
    setEditingIndex(null);
  };

  const handleDeleteEntry = (category, index) => {
    const deletedText = entries[category][index].text;
    const updated = entries[category].filter((_, i) => i !== index);
    saveData(category, updated);
    logChange("delete", `Usunięto "${deletedText}" z "${category}"`);
  };

  // Siatka powiązań
  const addNode = () => {
    if (!inputValue.trim()) return;

    const references = [];
    const words = inputValue.split(" ");
    words.forEach(word => {
      if (word.startsWith("@")) {
        const refType = word.slice(1).split(":")[0];
        const refId = word.slice(1).split(":")[1];

        const item = entries[refType]?.find(i => i.id == refId);
        if (item) {
          references.push(`Powiązane: ${item.text}`);
        }
      }
    });

    const newNode = {
      id: Date.now(),
      text: inputValue,
      x: 100 + nodes.length * 120,
      y: 150,
      references
    };

    setNodes([...nodes, newNode]);
    setInputValue("");
    logChange("create", `Dodano węzeł: ${newNode.text}`);
  };

  const selectNode = (id) => {
    setSelectedNodes(prev => {
      if (prev.includes(id)) {
        return prev.filter(n => n !== id);
      } else if (prev.length < 2) {
        return [...prev, id];
      } else {
        return [id];
      }
    });
  };

  const removeNode = (id) => {
    const node = nodes.find(n => n.id === id);
    setNodes(nodes.filter(n => n.id !== id));
    logChange("delete", `Usunięto węzeł: ${node?.text || id}`);
  };

  // Historia zmian
  const logChange = (type, description) => {
    const timestamp = new Date().toLocaleString();
    const history = [...changeHistory, { type, description, timestamp }];
    setChangeHistory(history);
    localStorage.setItem("dtu-bcso-history", JSON.stringify(history));
  };

  // Pobieranie kopii zapasowej
  const downloadBackup = () => {
    const dataStr = JSON.stringify(
      {
        entries,
        nodes,
        changeHistory
      },
      null,
      2
    );
    const blob = newBlob(dataStr, "dtu-bcso-backup.json");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "dtu-bcso-backup.json";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const newBlob = (data, filename) => {
    const blob = new Blob([data], { type: "application/json" });
    return blob;
  };

  // Wyszukiwarka
  const searchAllData = () => {
    const results = [];

    Object.entries(entries).forEach(([cat, items]) => {
      items.forEach(item => {
        if (item.text?.toLowerCase().includes(searchQuery.toLowerCase())) {
          results.push({ category: cat, text: item.text });
        }
      });
    });

    nodes.forEach(node => {
      if (node.text?.toLowerCase().includes(searchQuery.toLowerCase())) {
        results.push({ category: "siatkapowiazan", text: node.text });
      }
    });

    return results;
  };

  // Panel boczny z zakładkami
  const sidebarItems = ["podejrzani", "pojazdy", "raporty", "siatkapowiazan"];
  const isJohnPepe = users.find(u => u.username === username && u.role === "admin");

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-4">Logowanie DTU BCSO</h2>
          <input
            type="text"
            placeholder="Login"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 mb-4 bg-gray-700 border border-gray-600 rounded"
          />
          <input
            type="password"
            placeholder="Hasło"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 mb-4 bg-gray-700 border border-gray-600 rounded"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-purple-700 hover:bg-purple-600 transition text-white py-2 rounded"
          >
            Zaloguj się
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "podejrzani":
      case "pojazdy":
      case "raporty":
        return (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`Wpisz coś...`}
                className="flex-grow px-4 py-2 bg-gray-800 border border-gray-600 rounded"
              />
              <button
                onClick={editingIndex !== null ? handleUpdateEntry : () => handleSaveEntry(activeTab)}
                className="bg-purple-700 hover:bg-purple-600 text-white py-2 px-4 rounded"
              >
                {editingIndex !== null ? "Zaktualizuj" : "Zapisz"}
              </button>
            </div>

            <ul className="space-y-2">
              {entries[activeTab]?.map((entry, index) => (
                <li key={entry.id} className="bg-gray-800 p-3 rounded flex justify-between">
                  <span>{entry.text}</span>
                  <div className="space-x-2">
                    <button
                      onClick={() => handleEditEntry(activeTab, index)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(activeTab, index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ❌
                    </button>
                  </div>
                </li>
              ))}
              {entries[activeTab]?.length === 0 && (
                <p className="text-gray-400 italic">Brak danych.</p>
              )}
            </ul>
          </div>
        );

      case "siatkapowiazan":
        return (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Wpisz np. @podejrzani:123"
                className="flex-grow px-4 py-2 bg-gray-800 border border-gray-600 rounded"
              />
              <button
                onClick={addNode}
                className="bg-purple-700 hover:bg-purple-600 text-white py-2 px-4 rounded"
              >
                Dodaj węzeł
              </button>
            </div>

            <div className="relative h-[500px] border border-gray-600 rounded overflow-hidden bg-gray-800">
              <svg className="w-full h-full">
                {nodes.map((node) => (
                  <g key={node.id}>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="30"
                      fill="#7c3aed"
                      stroke="white"
                      strokeWidth="2"
                      onClick={() => selectNode(node.id)}
                      className="cursor-pointer"
                    />
                    <text
                      x={node.x}
                      y={node.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="12"
                      fontWeight="bold"
                      className="pointer-events-none"
                    >
                      {node.text}
                    </text>
                    {selectedNodes.includes(node.id) && (
                      <foreignObject x={node.x - 15} y={node.y - 35} width="30" height="20">
                        <button
                          className="text-xs text-red-400"
                          onClick={() => removeNode(node.id)}
                        >
                          ❌
                        </button>
                      </foreignObject>
                    )}
                  </g>
                ))}

                {/* Linia między wybranymi węzłami */}
                {selectedNodes.length === 2 && (() => {
                  const a = nodes.find(n => n.id === selectedNodes[0]);
                  const b = nodes.find(n => n.id === selectedNodes[1]);
                  return (
                    <line
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke="#a855f7"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                  );
                })()}
              </svg>
            </div>
          </div>
        );

      default:
        return <div>Brak zawartości</div>;
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 bg-purple-900 p-4 fixed left-0 top-0 bottom-0 overflow-y-auto">
        <h2 className="text-xl font-bold mb-6">DTU BCSO</h2>
        <ul className="space-y-2">
          <li><button onClick={() => setActiveTab("podejrzani")} className={activeTab === "podejrzani" ? "bg-purple-700 px-4 py-2 rounded w-full text-left" : "hover:bg-purple-800 px-4 py-2 rounded w-full text-left"}>Podejrzani</button></li>
          <li><button onClick={() => setActiveTab("pojazdy")} className={activeTab === "pojazdy" ? "bg-purple-700 px-4 py-2 rounded w-full text-left" : "hover:bg-purple-800 px-4 py-2 rounded w-full text-left"}>Pojazdy</button></li>
          <li><button onClick={() => setActiveTab("raporty")} className={activeTab === "raporty" ? "bg-purple-700 px-4 py-2 rounded w-full text-left" : "hover:bg-purple-800 px-4 py-2 rounded w-full text-left"}>Raporty</button></li>
          <li><button onClick={() => setActiveTab("siatkapowiazan")} className={activeTab === "siatkapowiazan" ? "bg-purple-700 px-4 py-2 rounded w-full text-left" : "hover:bg-purple-800 px-4 py-2 rounded w-full text-left"}>Siatka Powiązań</button></li>
          {isJohnPepe && (
            <li><button onClick={() => setActiveTab("historia")} className={activeTab === "historia" ? "bg-purple-700 px-4 py-2 rounded w-full text-left" : "hover:bg-purple-800 px-4 py-2 rounded w-full text-left"}>Historia Zmian</button></li>
          )}
          {isJohnPepe && (
            <li><button onClick={downloadBackup} className="bg-green-700 hover:bg-green-600 px-4 py-2 rounded w-full text-left mt-4">Pobierz backup</button></li>
          )}
          <li><button onClick={() => setIsLoggedIn(false)} className="bg-red-700 hover:bg-red-600 px-4 py-2 rounded w-full text-left mt-4">Wyloguj się</button></li>
        </ul>
      </aside>

      {/* Główna strona */}
      <main className="ml-64 flex-1 p-4">
        <header className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">BAZA DANYCH D.T.U BCSO</h1>
          <input
            type="text"
            placeholder="Szukaj..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 px-4 py-2 bg-gray-800 border border-gray-600 rounded"
          />
        </header>

        {/* Wyniki wyszukiwania */}
        {searchQuery && (
          <div className="mb-6 bg-gray-800 p-4 rounded">
            <h3 className="font-semibold mb-2">Wyniki wyszukiwania:</h3>
            {searchAllData().length > 0 ? (
              <ul className="list-disc ml-5">
                {searchAllData().map((result, idx) => (
                  <li key={idx}>[{result.category}] {result.text}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">Brak wyników</p>
            )}
          </div>
        )}

        {/* Sekcje zakładek */}
        {activeTab === "historia" ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Historia Zmian</h2>
            {changeHistory.length === 0 ? (
              <p className="text-gray-400">Brak zapisanych zmian</p>
            ) : (
              <ul className="space-y-2">
                {changeHistory.map((entry, idx) => (
                  <li key={idx} className="bg-gray-800 p-3 rounded shadow">
                    <strong>[{entry.type}]</strong> — {entry.description} <br />
                    <small className="text-gray-400">{entry.timestamp}</small>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <section>
            <h2 className="text-2xl font-bold capitalize mb-4">{activeTab}</h2>
            {renderContent()}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;