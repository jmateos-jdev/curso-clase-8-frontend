import { useEffect, useState } from 'react'
import './App.css'

type Registro = {
  id: number
  valor: number
}

function App() {
  const [clicks, setClicks] = useState(0)
  const [registros, setRegistros] = useState<Registro[]>([])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  async function cargarRegistros() {
    const respuesta = await fetch('/api/contador')
    if (!respuesta.ok) {
      throw new Error('No se pudieron cargar los registros')
    }
    const datos: Registro[] = await respuesta.json()
    setRegistros(datos)
    setError('')
  }

  useEffect(() => {
    const controlador = new AbortController()

    fetch('/api/contador', { signal: controlador.signal })
      .then((respuesta) => {
        if (!respuesta.ok) {
          throw new Error('No se pudieron cargar los registros')
        }
        return respuesta.json() as Promise<Registro[]>
      })
      .then((datos) => {
        setRegistros(datos)
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return
        }
        setError('No se pudieron cargar los registros')
      })

    return () => {
      controlador.abort()
    }
  }, [])

  async function guardarRegistro() {
    setGuardando(true)
    setError('')

    try {
      const respuesta = await fetch('/api/contador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor: clicks }),
      })

      if (!respuesta.ok) {
        throw new Error('No se pudo guardar el registro')
      }

      setClicks(0)
      await cargarRegistros()
    } catch {
      setError('No se pudo guardar el registro')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <main className="pagina">
      <h1>Contador de clicks</h1>

      <section className="formulario">
        <p className="clicks">Clicks: {clicks}</p>
        <div className="acciones">
          <button type="button" onClick={() => setClicks((valor) => valor + 1)}>
            Sumar click
          </button>
          <button
            type="button"
            onClick={() => {
              void guardarRegistro()
            }}
            disabled={guardando}
          >
            {guardando ? 'Guardando...' : 'Guardar registro'}
          </button>
        </div>
        {error ? <p className="error">{error}</p> : null}
      </section>

      <section>
        <h2>Registros</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            {registros.length === 0 ? (
              <tr>
                <td colSpan={2}>No hay registros</td>
              </tr>
            ) : (
              registros.map((registro) => (
                <tr key={registro.id}>
                  <td>{registro.id}</td>
                  <td>{registro.valor}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </main>
  )
}

export default App
