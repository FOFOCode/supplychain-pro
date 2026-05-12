import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'

const VIEWS = [
  { key: 'dashboard', label: 'Panel' },
  { key: 'envios', label: 'Envíos' },
  { key: 'productos', label: 'Productos' },
  { key: 'vehiculos', label: 'Vehículos' },
  { key: 'usuarios', label: 'Usuarios' },
  { key: 'rutas', label: 'Rutas' },
  { key: 'incidentes', label: 'Incidentes' },
  { key: 'asignaciones', label: 'Asignaciones' },
  { key: 'registros', label: 'Telemetría' },
  { key: 'detalles', label: 'Detalle envío' },
]

const EMPTY_FORMS = {
  envio: {
    codigo_rastreo: '',
    origen: '',
    destino: '',
    id_ruta: '',
    temp_max_permitida: '',
    temp_min_permitida: '',
  },
  producto: {
    codigo_sku: '',
    nombre: '',
    descripcion: '',
  },
  vehiculo: {
    placa: '',
    activo: true,
  },
  usuario: {
    id_rol: '',
    nombre_completo: '',
    correo: '',
    contrasena: '',
  },
  ruta: {
    nombre: '',
    waypoints_json: '[{"lat":0,"lng":0}]',
  },
  incidente: {
    id_envio: '',
    tipo_incidente: '',
    valor_registrado: '',
    valor_limite: '',
    descripcion: '',
  },
  detalle: {
    id_envio: '',
    id_producto: '',
    cantidad: '',
    peso_kg: '',
  },
  asignacion: {
    id_envio: '',
    id_vehiculo: '',
  },
}

function App() {
  const [view, setView] = useState('dashboard')
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('supplychain-user')
    return stored ? JSON.parse(stored) : null
  })
  const [loginForm, setLoginForm] = useState({ correo: '', contrasena: '' })
  const [forms, setForms] = useState(EMPTY_FORMS)
  const [query, setQuery] = useState({ envioId: '', detallesEnvioId: '', registrosEnvioId: '' })
  const [data, setData] = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const isAdmin = user?.rol === 'ADMIN'

  const authHeaders = useMemo(() => {
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [token])

  const fetchApi = useCallback(async (path, options = {}) => {
    const init = {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      ...options,
    }

    if (init.body && typeof init.body !== 'string') {
      init.body = JSON.stringify(init.body)
    }

    const res = await fetch(`${API_BASE}${path}`, init)
    const payload = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new Error(payload.error || payload.message || res.statusText)
    }

    return payload
  }, [authHeaders])

  const loadSummary = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [envios, productos, vehiculos, usuarios, incidentes, rutas, asignaciones] = await Promise.all([
        fetchApi('/envios'),
        fetchApi('/productos'),
        fetchApi('/vehiculos'),
        fetchApi('/usuarios'),
        fetchApi('/incidentes'),
        fetchApi('/rutas'),
        fetchApi('/envios-vehiculos'),
      ])

      setSummary({
        envios: envios.length,
        productos: productos.length,
        vehiculos: vehiculos.length,
        usuarios: usuarios.length,
        incidentes: incidentes.length,
        rutas: rutas.length,
        asignaciones: asignaciones.length,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [fetchApi])

  const loadViewData = useCallback(async (viewKey) => {
    setLoading(true)
    setError('')
    setData([])
    try {
      let payload = []
      switch (viewKey) {
        case 'envios':
          payload = await fetchApi('/envios')
          break
        case 'productos':
          payload = await fetchApi('/productos')
          break
        case 'vehiculos':
          payload = await fetchApi('/vehiculos')
          break
        case 'usuarios':
          payload = await fetchApi('/usuarios')
          break
        case 'rutas':
          payload = await fetchApi('/rutas')
          break
        case 'incidentes':
          payload = await fetchApi('/incidentes')
          break
        case 'asignaciones':
          payload = await fetchApi('/envios-vehiculos')
          break
        default:
          payload = []
      }
      setData(payload)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [fetchApi])

  useEffect(() => {
    if (token && user) {
      if (view === 'dashboard') {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadSummary()
      } else if (view !== 'registros' && view !== 'detalles') {
        loadViewData(view)
      }
    }
  }, [view, token, user, loadSummary, loadViewData])

  const handleLogin = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const payload = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      })

      const result = await payload.json()
      if (!payload.ok) throw new Error(result.error || 'No se pudo iniciar sesión')

      setToken(result.token)
      setUser(result.user)
      localStorage.setItem('token', result.token)
      localStorage.setItem('supplychain-user', JSON.stringify(result.user))
      setView('dashboard')
      setLoginForm({ correo: '', contrasena: '' })
      setMessage('Sesión iniciada correctamente')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setToken('')
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('supplychain-user')
    setView('login')
    setData([])
    setSummary({})
    setMessage('Sesión cerrada')
  }

  const handleCreate = async (entity) => {
    setLoading(true)
    setError('')
    setMessage('')
    try {
      let endpoint = ''
      let payload = forms[entity]

      switch (entity) {
        case 'envio':
          endpoint = '/envios'
          break
        case 'producto':
          endpoint = '/productos'
          break
        case 'vehiculo':
          endpoint = '/vehiculos'
          break
        case 'usuario':
          endpoint = '/usuarios'
          break
        case 'ruta':
          endpoint = '/rutas'
          payload = {
            nombre: payload.nombre,
            waypoints_json: payload.waypoints_json,
          }
          break
        case 'incidente':
          endpoint = '/incidentes'
          break
        case 'detalle':
          endpoint = '/detalles-envio'
          break
        case 'asignacion':
          endpoint = '/envios-vehiculos'
          break
        default:
          throw new Error('Entidad desconocida')
      }

      await fetchApi(endpoint, { method: 'POST', body: payload })
      setMessage('Elemento creado correctamente')
      setForms((prev) => ({
        ...prev,
        [entity]: EMPTY_FORMS[entity],
      }))
      if (view === entity || view === 'asignaciones') {
        loadViewData(view)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchRegistros = async () => {
    if (!query.registrosEnvioId) {
      setError('Ingresa un id_envio para ver la telemetría')
      return
    }
    setLoading(true)
    setError('')
    try {
      const payload = await fetchApi(`/registros/envio/${query.registrosEnvioId}?limit=100`)
      setData(payload)
      setMessage(`Telemetría del envío ${query.registrosEnvioId}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchDetalles = async () => {
    if (!query.detallesEnvioId) {
      setError('Ingresa un id_envio para ver los detalles del envío')
      return
    }
    setLoading(true)
    setError('')
    try {
      const payload = await fetchApi(`/detalles-envio?envio=${query.detallesEnvioId}`)
      setData(payload)
      setMessage(`Detalle de envío ${query.detallesEnvioId}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const renderTable = (rows) => {
    if (!rows || !rows.length) {
      return <p className="empty-state">No hay registros para mostrar.</p>
    }

    const columns = Object.keys(rows[0])
    return (
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column.replace(/_/g, ' ')}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={Object.values(row).join('-') + Math.random()}>
                {columns.map((column) => (
                  <td key={`${row.id}-${column}`} title={String(row[column] ?? '')}>
                    {typeof row[column] === 'object'
                      ? JSON.stringify(row[column])
                      : String(row[column] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderLogin = () => (
    <div className="panel card">
      <h2>Iniciar sesión</h2>
      <p>Usa un usuario existente para acceder a las rutas protegidas.</p>
      <form className="form-grid" onSubmit={handleLogin}>
        <label>
          Correo
          <input
            type="email"
            value={loginForm.correo}
            onChange={(event) => setLoginForm({ ...loginForm, correo: event.target.value })}
            required
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={loginForm.contrasena}
            onChange={(event) => setLoginForm({ ...loginForm, contrasena: event.target.value })}
            required
          />
        </label>
        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? 'Iniciando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  )

  const renderActionForm = (entity, fields, legend) => {
    if (!isAdmin) {
      return <p className="info-message">Solo los usuarios ADMIN pueden crear registros.</p>
    }

    return (
      <div className="card">
        <h3>{legend}</h3>
        <div className="form-grid">
          {fields}
          <button type="button" className="primary-button" onClick={() => handleCreate(entity)} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <strong>SupplyChain Pro</strong>
          <span>Frontend de administración</span>
        </div>
        <div className="header-actions">
          {user ? (
            <>
              <span className="user-badge">{user.nombre_completo} • {user.rol}</span>
              <button type="button" className="secondary-button" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </>
          ) : null}
        </div>
      </header>

      <div className="app-content">
        {user ? (
          <nav className="app-nav">
            {VIEWS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={item.key === view ? 'nav-button active' : 'nav-button'}
                onClick={() => {
                  setError('')
                  setMessage('')
                  setView(item.key)
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>
        ) : null}

        <main className="app-main">
        {error ? <div className="alert error">{error}</div> : null}
        {message ? <div className="alert success">{message}</div> : null}

        {!user ? renderLogin() : null}

        {user && view === 'dashboard' ? (
          <div className="grid-summary">
            <div className="card summary-card">
              <h2>Resumen general</h2>
              <div className="metric-grid">
                {[
                  { label: 'Envíos', value: summary.envios ?? 0 },
                  { label: 'Productos', value: summary.productos ?? 0 },
                  { label: 'Vehículos', value: summary.vehiculos ?? 0 },
                  { label: 'Usuarios', value: summary.usuarios ?? 0 },
                  { label: 'Incidentes', value: summary.incidentes ?? 0 },
                  { label: 'Rutas', value: summary.rutas ?? 0 },
                  { label: 'Asignaciones', value: summary.asignaciones ?? 0 },
                ].map((item) => (
                  <div key={item.label} className="metric-card">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {user && view === 'envios' ? (
          <div className="grid-summary">
            <div className="card">
              <h2>Envios</h2>
              {renderTable(data)}
            </div>
            {renderActionForm(
              'envio',
              <>
                <label>
                  Código de rastreo
                  <input value={forms.envio.codigo_rastreo} onChange={(e) => setForms({ ...forms, envio: { ...forms.envio, codigo_rastreo: e.target.value } })} />
                </label>
                <label>
                  Origen
                  <input value={forms.envio.origen} onChange={(e) => setForms({ ...forms, envio: { ...forms.envio, origen: e.target.value } })} />
                </label>
                <label>
                  Destino
                  <input value={forms.envio.destino} onChange={(e) => setForms({ ...forms, envio: { ...forms.envio, destino: e.target.value } })} />
                </label>
                <label>
                  Ruta (id_ruta)
                  <input value={forms.envio.id_ruta} onChange={(e) => setForms({ ...forms, envio: { ...forms.envio, id_ruta: e.target.value } })} />
                </label>
                <label>
                  Temperatura máxima
                  <input type="number" value={forms.envio.temp_max_permitida} onChange={(e) => setForms({ ...forms, envio: { ...forms.envio, temp_max_permitida: e.target.value } })} />
                </label>
                <label>
                  Temperatura mínima
                  <input type="number" value={forms.envio.temp_min_permitida} onChange={(e) => setForms({ ...forms, envio: { ...forms.envio, temp_min_permitida: e.target.value } })} />
                </label>
              </>,
              'Crear envío'
            )}
          </div>
        ) : null}

        {user && view === 'productos' ? (
          <div className="grid-summary">
            <div className="card">
              <h2>Productos</h2>
              {renderTable(data)}
            </div>
            {renderActionForm(
              'producto',
              <>
                <label>
                  SKU
                  <input value={forms.producto.codigo_sku} onChange={(e) => setForms({ ...forms, producto: { ...forms.producto, codigo_sku: e.target.value } })} />
                </label>
                <label>
                  Nombre
                  <input value={forms.producto.nombre} onChange={(e) => setForms({ ...forms, producto: { ...forms.producto, nombre: e.target.value } })} />
                </label>
                <label>
                  Descripción
                  <input value={forms.producto.descripcion} onChange={(e) => setForms({ ...forms, producto: { ...forms.producto, descripcion: e.target.value } })} />
                </label>
              </>,
              'Crear producto'
            )}
          </div>
        ) : null}

        {user && view === 'vehiculos' ? (
          <div className="grid-summary">
            <div className="card">
              <h2>Vehículos</h2>
              {renderTable(data)}
            </div>
            {renderActionForm(
              'vehiculo',
              <>
                <label>
                  Placa
                  <input value={forms.vehiculo.placa} onChange={(e) => setForms({ ...forms, vehiculo: { ...forms.vehiculo, placa: e.target.value } })} />
                </label>
                <label className="checkbox-label">
                  <span>Activo</span>
                  <input
                    type="checkbox"
                    checked={forms.vehiculo.activo}
                    onChange={(e) => setForms({ ...forms, vehiculo: { ...forms.vehiculo, activo: e.target.checked } })}
                  />
                </label>
              </>,
              'Crear vehículo'
            )}
          </div>
        ) : null}

        {user && view === 'usuarios' ? (
          <div className="grid-summary">
            <div className="card">
              <h2>Usuarios</h2>
              {renderTable(data)}
            </div>
            {renderActionForm(
              'usuario',
              <>
                <label>
                  ID Rol
                  <input value={forms.usuario.id_rol} onChange={(e) => setForms({ ...forms, usuario: { ...forms.usuario, id_rol: e.target.value } })} />
                </label>
                <label>
                  Nombre completo
                  <input value={forms.usuario.nombre_completo} onChange={(e) => setForms({ ...forms, usuario: { ...forms.usuario, nombre_completo: e.target.value } })} />
                </label>
                <label>
                  Correo
                  <input value={forms.usuario.correo} onChange={(e) => setForms({ ...forms, usuario: { ...forms.usuario, correo: e.target.value } })} />
                </label>
                <label>
                  Contraseña
                  <input type="password" value={forms.usuario.contrasena} onChange={(e) => setForms({ ...forms, usuario: { ...forms.usuario, contrasena: e.target.value } })} />
                </label>
              </>,
              'Crear usuario'
            )}
          </div>
        ) : null}

        {user && view === 'rutas' ? (
          <div className="grid-summary">
            <div className="card">
              <h2>Rutas</h2>
              {renderTable(data)}
            </div>
            {renderActionForm(
              'ruta',
              <>
                <label>
                  Nombre
                  <input value={forms.ruta.nombre} onChange={(e) => setForms({ ...forms, ruta: { ...forms.ruta, nombre: e.target.value } })} />
                </label>
                <label>
                  Waypoints JSON
                  <textarea value={forms.ruta.waypoints_json} onChange={(e) => setForms({ ...forms, ruta: { ...forms.ruta, waypoints_json: e.target.value } })} rows="4" />
                </label>
              </>,
              'Crear ruta'
            )}
          </div>
        ) : null}

        {user && view === 'incidentes' ? (
          <div className="grid-summary">
            <div className="card">
              <h2>Incidentes</h2>
              {renderTable(data)}
            </div>
            {renderActionForm(
              'incidente',
              <>
                <label>
                  ID Envío
                  <input value={forms.incidente.id_envio} onChange={(e) => setForms({ ...forms, incidente: { ...forms.incidente, id_envio: e.target.value } })} />
                </label>
                <label>
                  Tipo de incidente
                  <input value={forms.incidente.tipo_incidente} onChange={(e) => setForms({ ...forms, incidente: { ...forms.incidente, tipo_incidente: e.target.value } })} />
                </label>
                <label>
                  Valor registrado
                  <input value={forms.incidente.valor_registrado} onChange={(e) => setForms({ ...forms, incidente: { ...forms.incidente, valor_registrado: e.target.value } })} />
                </label>
                <label>
                  Valor límite
                  <input value={forms.incidente.valor_limite} onChange={(e) => setForms({ ...forms, incidente: { ...forms.incidente, valor_limite: e.target.value } })} />
                </label>
                <label>
                  Descripción
                  <input value={forms.incidente.descripcion} onChange={(e) => setForms({ ...forms, incidente: { ...forms.incidente, descripcion: e.target.value } })} />
                </label>
              </>,
              'Crear incidente'
            )}
          </div>
        ) : null}

        {user && view === 'asignaciones' ? (
          <div className="grid-summary">
            <div className="card">
              <h2>Asignaciones envío - vehículo</h2>
              {renderTable(data)}
            </div>
            {renderActionForm(
              'asignacion',
              <>
                <label>
                  ID Envío
                  <input value={forms.asignacion.id_envio} onChange={(e) => setForms({ ...forms, asignacion: { ...forms.asignacion, id_envio: e.target.value } })} />
                </label>
                <label>
                  ID Vehículo
                  <input value={forms.asignacion.id_vehiculo} onChange={(e) => setForms({ ...forms, asignacion: { ...forms.asignacion, id_vehiculo: e.target.value } })} />
                </label>
              </>,
              'Crear asignación'
            )}
          </div>
        ) : null}

        {user && view === 'registros' ? (
          <div className="grid-summary">
            <div className="card">
              <h2>Registros de telemetría</h2>
              <div className="form-grid">
                <label>
                  ID Envío
                  <input value={query.registrosEnvioId} onChange={(e) => setQuery({ ...query, registrosEnvioId: e.target.value })} />
                </label>
                <button type="button" className="primary-button" onClick={fetchRegistros} disabled={loading}>
                  {loading ? 'Buscando...' : 'Buscar registros'}
                </button>
              </div>
              {renderTable(data)}
            </div>
          </div>
        ) : null}

        {user && view === 'detalles' ? (
          <div className="grid-summary">
            <div className="card">
              <h2>Detalles de envío</h2>
              <div className="form-grid">
                <label>
                  ID Envío
                  <input value={query.detallesEnvioId} onChange={(e) => setQuery({ ...query, detallesEnvioId: e.target.value })} />
                </label>
                <button type="button" className="primary-button" onClick={fetchDetalles} disabled={loading}>
                  {loading ? 'Buscando...' : 'Buscar detalles'}
                </button>
              </div>
              {renderTable(data)}
            </div>
            {renderActionForm(
              'detalle',
              <>
                <label>
                  ID Envío
                  <input value={forms.detalle.id_envio} onChange={(e) => setForms({ ...forms, detalle: { ...forms.detalle, id_envio: e.target.value } })} />
                </label>
                <label>
                  ID Producto
                  <input value={forms.detalle.id_producto} onChange={(e) => setForms({ ...forms, detalle: { ...forms.detalle, id_producto: e.target.value } })} />
                </label>
                <label>
                  Cantidad
                  <input type="number" value={forms.detalle.cantidad} onChange={(e) => setForms({ ...forms, detalle: { ...forms.detalle, cantidad: e.target.value } })} />
                </label>
                <label>
                  Peso kg
                  <input type="number" value={forms.detalle.peso_kg} onChange={(e) => setForms({ ...forms, detalle: { ...forms.detalle, peso_kg: e.target.value } })} />
                </label>
              </>,
              'Crear detalle'
            )}
          </div>
        ) : null}
      </main>
      </div>
    </div>
  )
}

export default App
