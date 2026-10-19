import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowDownRight,
  ArrowUpRight,
  Edit3,
  Plus,
  Tag,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { categoryAPI } from '../services/api';
import {
  BottomSheet,
  Button,
  Card,
  Chip,
  EmptyState,
  FAB,
  Page,
  PageHeader,
  SegmentedControl,
  TextInput,
} from '../components/ui/CashewUI';

const EMOJIS = [
  '💰','💼','💻','🏢','🛒','🍽️','🚗','🛍️',
  '🎬','⚡','❤️','🛡️','📚','💹','📈','🪙',
  '🏦','🌅','🎯','🏠','✈️','🎮','☕','📱',
  '🎵','🏥','👶','🐾','💇','🧹','🎁','🔧',
  '🚌','⛽','📝','🍕','🥗','🏋️','💊','🎓',
];

const COLORS = [
  '#2db87d','#4a9eff','#e24b4a','#ef9f27',
  '#9b59b6','#1abc9c','#e74c3c','#3498db',
  '#2ecc71','#d35400','#8e44ad','#16a085',
];

const TYPE_TONE = {
  income: 'mint',
  expense: 'pink',
  investment: 'blue',
};

const blankForm = () => ({
  name: '',
  type: 'expense',
  icon: '💰',
  color: '#2db87d',
});

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [form, setForm] = useState(blankForm());

  function loadCategories() {
    categoryAPI.getAll()
      .then(({ data }) => setCategories(data.data || []))
      .catch(() => toast.error('Failed to load categories'))
      .finally(() => setLoading(false));
  }

  useEffect(loadCategories, []);

  const filtered = typeFilter
    ? categories.filter(c => c.type === typeFilter)
    : categories;

  const counts = {
    all: categories.length,
    income: categories.filter(c => c.type === 'income').length,
    expense: categories.filter(c => c.type === 'expense').length,
    investment: categories.filter(c => c.type === 'investment').length,
  };

  function openCreate() {
    setEditCat(null);
    setForm(blankForm());
    setModal(true);
  }

  function openEdit(cat) {
    setEditCat(cat);
    setForm({
      name: cat.name,
      type: cat.type,
      icon: cat.icon || '💰',
      color: cat.color || '#2db87d',
    });
    setModal(true);
  }

  function closeModal() {
    setModal(false);
    setEditCat(null);
    setForm(blankForm());
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      if (editCat) {
        const { data } = await categoryAPI.update(editCat.id, form);
        setCategories(prev => prev.map(c => c.id === editCat.id ? { ...c, ...data.data } : c));
        toast.success('Category updated');
      } else {
        const { data } = await categoryAPI.create(form);
        setCategories(prev => [data.data, ...prev]);
        toast.success('Category created');
      }
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save category');
    }
  }

  async function handleDelete(cat) {
    if (cat.is_default) {
      toast.error('Cannot delete default category');
      return;
    }
    if (!confirm(`Delete "${cat.name}"?`)) return;

    try {
      await categoryAPI.remove(cat.id);
      setCategories(prev => prev.filter(c => c.id !== cat.id));
      toast.success('Category deleted');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete');
    }
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Taxonomy & Metadata"
        title="Categories"
        subtitle={`${counts.all} classified categories organizing your inflows, outflows, and capital allocations.`}
        action={
          <Button variant="primary" onClick={openCreate}>
            <Plus size={16} /> New Category
          </Button>
        }
      />

      <div className="data-card" style={{ marginBottom: 20 }}>
        <div className="data-card-body" style={{ padding: '18px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Categories</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 2, color: 'var(--text)' }}>
                {counts.all}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Income Sources</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 2, color: '#10b981' }}>
                {counts.income}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Expense Envelopes</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 2, color: '#f43f5e' }}>
                {counts.expense}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Investment Assets</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 2, color: '#0284c7' }}>
                {counts.investment}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="data-card" style={{ marginBottom: 20 }}>
        <div className="data-card-body" style={{ padding: '14px 18px' }}>
          <SegmentedControl
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: '', label: `All (${counts.all})` },
              { value: 'income', label: `Income (${counts.income})` },
              { value: 'expense', label: `Expense (${counts.expense})` },
              { value: 'investment', label: `Invest (${counts.investment})` },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', placeItems: 'center', minHeight: 260 }}>
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Tag />}
          title={typeFilter ? `No ${typeFilter} categories` : 'No categories configured'}
          text={typeFilter ? 'Try selecting a different type filter or create a new custom category.' : 'Create categories to label your transactions and automate budgeting.'}
          action={<Button onClick={openCreate}><Plus size={16} /> Create category</Button>}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {filtered.map(cat => (
            <div key={cat.id} className="data-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '1.3rem',
                    background: `${cat.color || '#2db87d'}20`,
                    border: `1px solid ${cat.color || '#2db87d'}40`,
                    flexShrink: 0
                  }}
                >
                  {cat.icon || '💰'}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {cat.name}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <span className={`badge-pill ${cat.type === 'income' ? 'badge-pill-mint' : cat.type === 'investment' ? 'badge-pill-blue' : 'badge-pill-pink'}`} style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                      {cat.type}
                    </span>
                    {cat.is_default && (
                      <span className="badge-pill badge-pill-neutral" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                        System
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {!cat.is_default && (
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    onClick={() => openEdit(cat)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 3, border: '1px solid var(--border)', background: 'var(--surface-strong)', color: 'var(--text)', borderRadius: 6, padding: '3px 8px', fontSize: '0.74rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    <Edit3 size={11} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 3, border: '1px solid rgba(239, 68, 68, 0.25)', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', borderRadius: 6, padding: '3px 8px', fontSize: '0.74rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <FAB icon={<Plus size={22} />} label="Create category" onClick={openCreate} />

      {modal && (
        <BottomSheet title={editCat ? 'Edit Category' : 'New Category'} onClose={closeModal}>
          <TextInput
            label="Name"
            value={form.name}
            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Groceries, Salary, Stocks..."
          />

          {!editCat && (
            <div style={{ marginBottom: 12 }}>
              <SegmentedControl
                value={form.type}
                onChange={value => setForm(prev => ({ ...prev, type: value }))}
                options={[
                  { value: 'expense', label: 'Expense', icon: <ArrowDownRight /> },
                  { value: 'income', label: 'Income', icon: <ArrowUpRight /> },
                  { value: 'investment', label: 'Invest', icon: <TrendingUp /> },
                ]}
              />
            </div>
          )}

          <div className="field">
            <span>Icon</span>
            <div className="emoji-picker-grid">
              {EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  className={`emoji-btn ${form.icon === emoji ? 'active' : ''}`}
                  onClick={() => setForm(prev => ({ ...prev, icon: emoji }))}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span>Color</span>
            <div className="swatch-grid">
              {COLORS.map(color => (
                <button
                  key={color}
                  className={`swatch ${form.color === color ? 'active' : ''}`}
                  style={{ background: color }}
                  aria-label={`Select ${color}`}
                  onClick={() => setForm(prev => ({ ...prev, color }))}
                />
              ))}
            </div>
          </div>

          <Button className="ui-button-full" onClick={handleSave}>
            <Tag size={18} /> {editCat ? 'Save changes' : 'Create category'}
          </Button>
        </BottomSheet>
      )}
    </Page>
  );
}
