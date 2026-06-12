'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Player } from '@/types';
import { PlayerAvatar } from '@/components/players/PlayerAvatar';
import { getPlayerPhotoUrl } from '@/lib/utils';
import { Search, Plus, Pencil, Trash2, X } from 'lucide-react';

export default function JugadoresAdminPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDefense, setFormDefense] = useState(5);
  const [formAttack, setFormAttack] = useState(5);
  const [formFitness, setFormFitness] = useState(5);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const supabase = createClient();

  const fetchPlayers = async () => {
    const { data } = await supabase
      .from('players')
      .select('*')
      .order('name');
    setPlayers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const filtered = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingPlayer(null);
    setFormName('');
    setFormDefense(5);
    setFormAttack(5);
    setFormFitness(5);
    setPhotoFile(null);
    setPhotoPreview(null);
    setShowModal(true);
  };

  const openEditModal = (player: Player) => {
    setEditingPlayer(player);
    setFormName(player.name);
    setFormDefense(player.defense);
    setFormAttack(player.attack);
    setFormFitness(player.fitness);
    setPhotoFile(null);
    setPhotoPreview(getPlayerPhotoUrl(player.photo_url));
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let photoUrl = editingPlayer?.photo_url || null;

    if (photoFile) {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('player-photos')
        .upload(fileName, photoFile);
        
      if (!error && data) {
        photoUrl = data.path;
      } else if (error) {
        console.error('Error uploading image:', error);
        alert('Hubo un error al subir la foto. Asegúrate de haber creado el bucket "player-photos" en Supabase.');
      }
    }

    const playerData = {
      name: formName,
      defense: formDefense,
      attack: formAttack,
      fitness: formFitness,
      photo_url: photoUrl,
    };

    if (editingPlayer) {
      await supabase
        .from('players')
        .update(playerData)
        .eq('id', editingPlayer.id);
    } else {
      await supabase.from('players').insert(playerData);
    }

    setSaving(false);
    setShowModal(false);
    fetchPlayers();
  };

  const handleToggleActive = async (player: Player) => {
    await supabase
      .from('players')
      .update({ is_active: !player.is_active })
      .eq('id', player.id);
    fetchPlayers();
  };

  const totalScore = formDefense + formAttack + formFitness;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-lg" style={{ flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <h1>👥 Gestión de Jugadores</h1>
        <button className="btn btn-primary" onClick={openCreateModal} id="add-player-btn">
          <Plus size={18} /> Nuevo Jugador
        </button>
      </div>

      {/* Search */}
      <div className="search-bar mb-lg">
        <Search size={18} className="search-bar-icon" />
        <input
          type="text"
          className="input"
          placeholder="Buscar jugador..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="admin-player-search"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col gap-sm">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton skeleton-card" style={{ height: '60px' }} />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="table-container">
          <table className="table" id="players-admin-table">
            <thead>
              <tr>
                <th>Jugador</th>
                <th>DEF</th>
                <th>ATK</th>
                <th>FIT</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((player) => (
                <tr key={player.id} style={{ opacity: player.is_active ? 1 : 0.5 }}>
                  <td>
                    <div className="flex items-center gap-sm">
                      <PlayerAvatar
                        name={player.name}
                        photoUrl={getPlayerPhotoUrl(player.photo_url)}
                        size="sm"
                      />
                      <span className="font-semibold">{player.name}</span>
                    </div>
                  </td>
                  <td>{player.defense}</td>
                  <td>{player.attack}</td>
                  <td>{player.fitness}</td>
                  <td>
                    <span className="font-bold">{player.total_score}</span>
                  </td>
                  <td>
                    <span className={`badge ${player.is_active ? 'badge-success' : 'badge-default'}`}>
                      {player.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-xs">
                      <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => openEditModal(player)}
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => handleToggleActive(player)}
                        title={player.is_active ? 'Desactivar' : 'Activar'}
                        style={{ color: player.is_active ? 'var(--accent-danger)' : 'var(--accent-secondary)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-title">Sin jugadores</div>
            <div className="empty-state-text">Añade el primer jugador con el botón de arriba.</div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} id="player-form-modal">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingPlayer ? 'Editar Jugador' : 'Nuevo Jugador'}
              </h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="input-group">
                  <label htmlFor="player-name" className="input-label">Nombre</label>
                  <input
                    id="player-name"
                    type="text"
                    className="input"
                    placeholder="Nombre del jugador"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Foto de perfil</label>
                  <div className="flex items-center gap-sm">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div className="skeleton skeleton-circle" style={{ width: 48, height: 48 }} />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="input"
                      style={{ padding: '0.4rem', flex: 1 }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setPhotoFile(file);
                          setPhotoPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">
                    Defensa: <span style={{ color: 'var(--accent-primary)' }}>{formDefense}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formDefense}
                    onChange={(e) => setFormDefense(Number(e.target.value))}
                    className="w-full"
                    style={{ accentColor: 'var(--accent-primary)' }}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">
                    Ataque: <span style={{ color: 'var(--accent-danger)' }}>{formAttack}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formAttack}
                    onChange={(e) => setFormAttack(Number(e.target.value))}
                    className="w-full"
                    style={{ accentColor: 'var(--accent-danger)' }}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">
                    Condición Física: <span style={{ color: 'var(--accent-secondary)' }}>{formFitness}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formFitness}
                    onChange={(e) => setFormFitness(Number(e.target.value))}
                    className="w-full"
                    style={{ accentColor: 'var(--accent-secondary)' }}
                  />
                </div>

                <div className="card text-center" style={{ background: 'var(--bg-surface)', padding: 'var(--space-md)' }}>
                  <div className="text-xs text-muted mb-xs">Puntuación Total</div>
                  <div className="font-bold" style={{ fontSize: '2rem', color: 'var(--accent-primary)' }}>
                    {totalScore}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving} id="save-player-btn">
                  {saving ? 'Guardando...' : editingPlayer ? 'Guardar Cambios' : 'Crear Jugador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
