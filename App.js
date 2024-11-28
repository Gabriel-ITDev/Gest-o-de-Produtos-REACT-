import React, { useState, useRef } from 'react';
import './App.css';
import Quagga from 'quagga';

const mockDatabase = {
  products: [],
};

function App() {
  const [products, setProducts] = useState(mockDatabase.products);
  const [users, setUsers] = useState([
    { username: 'fabio', password: '123', role: 'admin' },
  ]);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [mode, setMode] = useState('');
  const [message, setMessage] = useState('');
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [newUser, setNewUser] = useState({ username: '', password: '' });
  const [newProduct, setNewProduct] = useState({
    code: '',
    name: '',
    validade: '',
    lote: '',
    image: null,
  });

  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogin = () => {
    const user = users.find(
      (u) => u.username === loginData.username && u.password === loginData.password
    );
    if (user) {
      setIsLoggedIn(true);
      setCurrentUser(user);
      setMode(user.role);
      setMessage(`Bem-vindo, ${user.username}!`);
    } else {
      setMessage('Credenciais inválidas.');
    }
  };

  const handleRegister = () => {
    if (!newUser.username || !newUser.password) {
      setMessage('Preencha todos os campos.');
      return;
    }
    if (users.some((u) => u.username === newUser.username)) {
      setMessage('Nome de usuário já existe.');
      return;
    }

    const user = { ...newUser, role: 'operator' };
    setUsers([...users, user]);
    setMessage('Usuário registrado com sucesso.');
    setNewUser({ username: '', password: '' });
  };

  const handleAddProduct = () => {
    if (!newProduct.code || !newProduct.name || !newProduct.validade || !newProduct.lote) {
      setMessage('Preencha todos os campos do produto.');
      return;
    }

    if (products.some((product) => product.code === newProduct.code)) {
      setMessage('Código de produto já existe.');
      return;
    }

    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);
    mockDatabase.products = updatedProducts;
    setNewProduct({ code: '', name: '', validade: '', lote: '', image: null });
    setMessage('Produto adicionado com sucesso.');
  };

  const startScanner = () => {
    setIsScanning(true);
    setMessage('Aponte a câmera para o código de barras.');

    Quagga.init(
      {
        inputStream: {
          name: 'Live',
          type: 'LiveStream',
          target: scannerRef.current,
          constraints: {
            width: 640,
            height: 480,
            facingMode: 'environment',
          },
        },
        decoder: {
          readers: ['code_128_reader', 'ean_reader'],
        },
      },
      (err) => {
        if (err) {
          console.error('Erro ao inicializar o Quagga:', err);
          setMessage('Erro ao inicializar o scanner. Verifique a câmera.');
          setIsScanning(false);
          return;
        }
        Quagga.start();
      }
    );

    Quagga.onDetected((data) => {
      const barcode = data.codeResult.code;
      setNewProduct((prev) => ({ ...prev, code: barcode }));
      setMessage(`Código de barras detectado: ${barcode}`);
      stopScanner();
    });
  };

  const stopScanner = () => {
    if (isScanning) {
      Quagga.stop();
      setIsScanning(false);
    }
  };

  const capturePhoto = () => {
    const videoElement = scannerRef.current.querySelector('video');
    if (videoElement) {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      const context = canvas.getContext('2d');
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      const imageDataUrl = canvas.toDataURL('image/png');
      setNewProduct((prev) => ({ ...prev, image: imageDataUrl }));
      setMessage('Imagem capturada com sucesso!');
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="App">
      <header className="App-header">
        <h1>Gestão de Produtos</h1>
        {!isLoggedIn ? (
          <div>
            <h2>Login</h2>
            {message && <p>{message}</p>}
            <input
              type="text"
              placeholder="Utilizador"
              value={loginData.username}
              onChange={(e) =>
                setLoginData({ ...loginData, username: e.target.value })
              }
            />
            <input
              type="password"
              placeholder="Senha"
              value={loginData.password}
              onChange={(e) =>
                setLoginData({ ...loginData, password: e.target.value })
              }
            />
            <button onClick={handleLogin}>Entrar</button>

            <h2>Registrar</h2>
            <input
              type="text"
              placeholder="Novo utilizador"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
            />
            <input
              type="password"
              placeholder="Senha"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            />
            <button onClick={handleRegister}>Registrar</button>
          </div>
        ) : (
          <div>
            <p>Bem-vindo, {currentUser.username}! Papel: {currentUser.role}</p>
            <button onClick={() => setIsLoggedIn(false)}>Sair</button>
            {currentUser.role === 'admin' && (
              <div className="mode-selection">
                <button onClick={() => setMode('admin')}>Modo Administrador</button>
                <button onClick={() => setMode('operator')}>Modo Operador</button>
              </div>
            )}
          </div>
        )}
      </header>

      {isLoggedIn && mode === 'admin' && (
        <div className="admin-mode">
          <h2>Modo Administrador</h2>
          {message && <p>{message}</p>}
          <h3>Adicionar Produto</h3>
          <div>
            <input
              type="text"
              placeholder="Código do Produto"
              value={newProduct.code}
              onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value })}
            />
            <input
              type="text"
              placeholder="Nome do Produto"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            />
            <input
              type="date"
              placeholder="Validade"
              value={newProduct.validade}
              onChange={(e) => setNewProduct({ ...newProduct, validade: e.target.value })}
            />
            <input
              type="text"
              placeholder="Lote"
              value={newProduct.lote}
              onChange={(e) => setNewProduct({ ...newProduct, lote: e.target.value })}
            />
            <button onClick={handleAddProduct}>Adicionar Produto</button>
          </div>

          <div>
            {!isScanning ? (
              <button onClick={startScanner}>Iniciar Scanner</button>
            ) : (
              <>
                <button onClick={stopScanner}>Parar Scanner</button>
                <button onClick={capturePhoto}>Capturar Foto</button>
              </>
            )}
            <div ref={scannerRef} style={{ width: '480px', height: '360px', margin: '0 auto' }}></div>
          </div>
        </div>
      )}

      {isLoggedIn && mode === 'operator' && (
        <div className="operator-mode">
          <h2>Modo Operador</h2>
          {message && <p>{message}</p>}
          <h3>Produtos Cadastrados</h3>
          <input
            type="text"
            placeholder="Pesquisar produtos"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <ul>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product, index) => (
                <li key={index}>
                  <strong>Código:</strong> {product.code} <br />
                  <strong>Nome:</strong> {product.name} <br />
                  <strong>Validade:</strong> {product.validade} <br />
                  <strong>Lote:</strong> {product.lote} <br />
                  {product.image && (
                    <>
                      <strong>Imagem:</strong>
                      <img src={product.image} alt="Produto" style={{ width: '100px' }} />
                    </>
                  )}
                </li>
              ))
            ) : (
              <p>Nenhum produto encontrado.</p>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
