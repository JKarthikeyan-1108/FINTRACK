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
        eyebrow="Organization"
        title="Categories"
        subtitle={`${counts.all} categories helping you organize your finances`}
        action={<Button variant="primary" onClick={openCreate}><Plus size={18} /> New</Button>}
      />

      <Card tone="mint" style={{ marginBottom: 14 }}>
        <div className="category-summary-grid">
          <div className="category-summary-item">
            <strong>{counts.all}</strong>
            <span>Total</span>
          </div>
          <div className="category-summary-item">
            <strong style={{ color: 'var(--mint-dark)' }}>{counts.income}</strong>
            <span>Income</span>
          </div>
          <div className="category-summary-item">
            <strong style={{ color: 'var(--red)' }}>{counts.expense}</strong>
            <span>Expense</span>
          </div>
          <div className="category-summary-item">
            <strong style={{ color: 'var(--blue)' }}>{counts.investment}</strong>
            <span>Invest</span>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <SegmentedControl
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: '', label: 'All', icon: <Tag /> },
            { value: 'income', label: 'Income', icon: <ArrowUpRight /> },
            { value: 'expense', label: 'Expense', icon: <ArrowDownRight /> },
            { value: 'investment', label: 'Invest', icon: <TrendingUp /> },
          ]}
        />
      </Card>

      {loading ? (
        <div style={{ display: 'grid', placeItems: 'center', minHeight: 260 }}>
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Tag />}
          title={typeFilter ? `No ${typeFilter} categories` : 'No categories yet'}
          text={typeFilter ? 'Try selecting a different type or create a new category.' : 'Create your first category to start organizing transactions.'}
          action={<Button onClick={openCreate}><Plus size={18} /> Create category</Button>}
        />
      ) : (
        <div className="category-grid">
          {filtered.map(cat => (
            <Card key={cat.id} className="category-card">
              <div className="category-card-head">
                <div
                  className="category-emoji"
                  style={{ background: `${cat.color || '#2db87d'}20` }}
                >
                  {cat.icon || '💰'}
                </div>
                <div className="category-card-info">
                  <strong>{cat.name}</strong>
                  <div className="category-card-badges">
                    <Chip tone={TYPE_TONE[cat.type] || 'neutral'}>
                      {cat.type}
                    </Chip>
                    {cat.is_default ? (
                      <Chip tone="blue">Default</Chip>
                    ) : null}
                  </div>
                </div>
              </div>

              {!cat.is_default && (
                <div className="category-card-actions">
                  <button onClick={() => openEdit(cat)}>
                    <Edit3 size={13} /> Edit
                  </button>
                  <button onClick={() => handleDelete(cat)}>
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <FAB icon={<Plus size={24} />} label="Create category" onClick={openCreate} />

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
