import React, { useEffect, useState } from 'react';
import mockDb from '../services/mockDb';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const emptyForm = {
  text: '',
  options: ['', '', '', ''],
  correctAnswerIndex: 0,
  category: '',
  explanation: ''
};

export default function AdminPage() {
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchQuestions = async () => {
    setLoading(true);
    const snap = await mockDb.collection('questions').get();
    setQuestions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  };

  useEffect(() => { fetchQuestions(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };
  const handleOptionChange = (idx, value) => {
    setForm(f => {
      const options = [...f.options];
      options[idx] = value;
      return { ...f, options };
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await mockDb.collection('questions').doc(editingId).update(form);
    } else {
      await mockDb.collection('questions').add(form);
    }
    setForm(emptyForm);
    setEditingId(null);
    fetchQuestions();
  };
  const handleEdit = (q) => {
    setForm(q);
    setEditingId(q.id);
  };
  const handleDelete = async (id) => {
    await mockDb.collection('questions').doc(id).delete();
    fetchQuestions();
  };

  return (
    <div className="container min-h-screen px-4 py-8 space-y-6">
      <Card>
        <CardHeader className="pb-2"><h2 className="text-2xl font-bold">Admin Panel</h2></CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="grid gap-3">
            <Input name="text" value={form.text} onChange={handleChange} placeholder="Question text" required />
            <div className="grid gap-3 sm:grid-cols-3">
              <Input name="category" value={form.category} onChange={handleChange} placeholder="Category" required />
              <Input name="explanation" value={form.explanation} onChange={handleChange} placeholder="Explanation" required />
              <div className="grid gap-2">
                <span className="text-sm text-white/70">Correcta</span>
                <div className="flex flex-wrap gap-3">
                  {form.options.map((_, idx) => (
                    <label key={idx} className="inline-flex items-center gap-2 text-sm">
                      <input type="radio" name="correctAnswerIndex" checked={form.correctAnswerIndex === idx} onChange={() => setForm(f => ({ ...f, correctAnswerIndex: idx }))} className="h-4 w-4" />
                      <span>{idx + 1}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {form.options.map((opt, idx) => (
                <Input key={idx} value={opt} onChange={e => handleOptionChange(idx, e.target.value)} placeholder={`Option ${idx + 1}`} required />
              ))}
            </div>
            <div className="flex gap-3 justify-end">
              {editingId && <Button type="button" variant="secondary" onClick={() => { setForm(emptyForm); setEditingId(null); }}>Cancel</Button>}
              <Button type="submit">{editingId ? 'Update' : 'Add'} Question</Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="pb-2"><h3 className="text-xl font-semibold">Questions</h3></CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex items-center gap-3 text-white/80"><div className="loading-spinner" /> Loading…</div>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left">
                  <tr className="border-b border-white/10">
                    <th className="py-2 pr-3">Text</th>
                    <th className="py-2 pr-3">Category</th>
                    <th className="py-2 pr-3">Options</th>
                    <th className="py-2 pr-3">Correct</th>
                    <th className="py-2 pr-3">Explanation</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map(q => (
                    <tr key={q.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-2 pr-3 align-top">{q.text}</td>
                      <td className="py-2 pr-3 align-top">{q.category}</td>
                      <td className="py-2 pr-3 align-top">{q.options.join(', ')}</td>
                      <td className="py-2 pr-3 align-top">{q.options[q.correctAnswerIndex]}</td>
                      <td className="py-2 pr-3 align-top">{q.explanation}</td>
                      <td className="py-2 flex gap-2">
                        <Button variant="secondary" onClick={() => handleEdit(q)}>Edit</Button>
                        <Button variant="outline" onClick={() => handleDelete(q.id)}>Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}