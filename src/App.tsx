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
  const [eliminando, setEliminando] = useState(false)
  const [registroAEliminar, setRegistroAEliminar] = useState<Registro | null>(
    null,
  )
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

  useEffect(() => {
    if (!registroAEliminar) {
      return
    }

    function cerrarConEscape(evento: KeyboardEvent) {
      if (evento.key === 'Escape' && !eliminando) {
        setRegistroAEliminar(null)
      }
    }

    window.addEventListener('keydown', cerrarConEscape)
    return () => {
      window.removeEventListener('keydown', cerrarConEscape)
    }
  }, [registroAEliminar, eliminando])

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

  async function eliminarRegistro() {
    if (!registroAEliminar) {
      return
    }

    setEliminando(true)
    setError('')

    try {
      const respuesta = await fetch(`/api/contador/${registroAEliminar.id}`, {
        method: 'DELETE',
      })

      if (!respuesta.ok) {
        throw new Error('No se pudo eliminar el registro')
      }

      setRegistroAEliminar(null)
      await cargarRegistros()
    } catch {
      setError('No se pudo eliminar el registro')
    } finally {
      setEliminando(false)
    }
  }

  const totalGuardado = registros.reduce(
    (acumulado, registro) => acumulado + registro.valor,
    0,
  )

  return (
    <div className="escena">
      <div className="halo halo-izq" aria-hidden="true" />
      <div className="halo halo-der" aria-hidden="true" />

      <header className="encabezado">
        <p className="marca">Pulso</p>
        <p className="lema">Laboratorio de clicks · sesión viva</p>
      </header>

      <main className="tablero">
        <section className="panel panel-contador">
          <p className="etiqueta">Clicks de esta sesión</p>
          <button
            type="button"
            className="clicker"
            onClick={() => setClicks((valor) => valor + 1)}
          >
            <span className="numero">{clicks}</span>
            <span className="hint">Tocá para sumar</span>
          </button>

          <div className="acciones">
            <button
              type="button"
              className="boton boton-secundario"
              onClick={() => setClicks(0)}
              disabled={clicks === 0}
            >
              Reiniciar
            </button>
            <button
              type="button"
              className="boton boton-principal"
              onClick={() => {
                void guardarRegistro()
              }}
              disabled={guardando}
            >
              {guardando ? 'Guardando...' : 'Guardar registro'}
            </button>
          </div>

          {error && !registroAEliminar ? (
            <p className="error">{error}</p>
          ) : null}
        </section>

        <section className="panel panel-registros">
          <div className="cabecera-lista">
            <div>
              <h2>Registros</h2>
              <p className="resumen">
                {registros.length} guardados · {totalGuardado} clicks en total
              </p>
            </div>
          </div>

          {registros.length === 0 ? (
            <div className="vacio">
              <p>Todavía no hay pulsos guardados.</p>
              <p>Sumá clicks y guardá el primer registro.</p>
            </div>
          ) : (
            <ul className="lista">
              {registros.map((registro) => (
                <li key={registro.id} className="item">
                  <div className="dato">
                    <span className="id">#{registro.id}</span>
                    <strong className="valor">{registro.valor}</strong>
                    <span className="unidad">clicks</span>
                  </div>
                  <button
                    type="button"
                    className="boton boton-peligro"
                    onClick={() => {
                      setError('')
                      setRegistroAEliminar(registro)
                    }}
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {registroAEliminar ? (
        <div
          className="modal-fondo"
          onClick={() => {
            if (!eliminando) {
              setRegistroAEliminar(null)
            }
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-eliminar"
            onClick={(evento) => evento.stopPropagation()}
          >
            <p className="modal-kicker">Acción irreversible</p>
            <h3 id="titulo-eliminar">¿Eliminar este registro?</h3>
            <p className="modal-cuerpo">
              Se va a borrar el registro #{registroAEliminar.id} con{' '}
              <strong>{registroAEliminar.valor}</strong> clicks. Esta acción no
              se puede deshacer.
            </p>
            {error ? <p className="error">{error}</p> : null}
            <div className="acciones modal-acciones">
              <button
                type="button"
                className="boton boton-secundario"
                onClick={() => setRegistroAEliminar(null)}
                disabled={eliminando}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="boton boton-peligro"
                onClick={() => {
                  void eliminarRegistro()
                }}
                disabled={eliminando}
              >
                {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default App
