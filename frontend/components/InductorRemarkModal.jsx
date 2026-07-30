import React, { useState, useEffect } from "react";
import { X, Send, History, Clock, User } from "lucide-react";
import axios from "axios";

const CATEGORY_COLORS = {
  Maintenance: "bg-red-500/20 text-red-400 border-red-500/30",
  Greasing: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Inspection: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  General: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};

export default function InductorRemarkModal({ isOpen, onClose, inductor }) {
  const [remarkText, setRemarkText] = useState("");
  const [category, setCategory] = useState("General");
  const [remarksList, setRemarksList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && inductor?.key) {
      fetchRemarks();
    }
  }, [isOpen, inductor]);

  const fetchRemarks = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/inductors/remarks/${inductor.key}`);
      if (res.data.success) {
        setRemarksList(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!remarkText.trim()) return;

    try {
      const res = await axios.post("/api/inductors/remarks", {
        inductorKey: inductor.key,
        inductorName: inductor.title,
        remark: remarkText,
        category,
      });

      if (res.data.success) {
        setRemarkText("");
        fetchRemarks();
      }
    } catch (err) {
      alert("Error saving remark");
    }
  };

  if (!isOpen || !inductor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h2 className="text-base font-extrabold text-cyan-400 uppercase tracking-wide">
              {inductor.title}
            </h2>
            <p className="text-xs text-slate-400">Add operational logs and view historical remarks</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* ADD REMARK FORM */}
          <form onSubmit={handleSave} className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-bold text-slate-300">New Remark Entry</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 outline-none focus:border-cyan-500"
              >
                <option value="General">General</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Greasing">Greasing</option>
                <option value="Inspection">Inspection</option>
              </select>
            </div>

            <textarea
              rows="2"
              value={remarkText}
              onChange={(e) => setRemarkText(e.target.value)}
              placeholder={`Type remark for ${inductor.title}...`}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white outline-none focus:border-cyan-500 resize-none"
            ></textarea>

            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-md"
              >
                <Send size={13} /> Save Remark
              </button>
            </div>
          </form>

          {/* COLORFUL HISTORY TIMELINE */}
          <div>
            <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2 mb-4">
              <History size={14} className="text-cyan-400" />
              Remark History Logs ({remarksList.length})
            </h3>

            {loading ? (
              <div className="text-center py-6 text-xs text-slate-500">Loading history...</div>
            ) : remarksList.length > 0 ? (
              <div className="space-y-3 relative border-l-2 border-slate-800 ml-3 pl-4">
                {remarksList.map((item) => (
                  <div
                    key={item._id}
                    className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 relative group hover:border-slate-700 transition-all"
                  >
                    <div className="absolute -left-[23px] top-4 w-3 h-3 rounded-full bg-cyan-400 border-2 border-slate-900"></div>

                    <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          CATEGORY_COLORS[item.category] || CATEGORY_COLORS.General
                        }`}
                      >
                        {item.category}
                      </span>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <User size={10} /> {item.createdBy}
                        </span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Clock size={10} /> {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed">{item.remark}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-500 bg-slate-950/30 rounded-xl border border-slate-800/50">
                No history remarks recorded yet for this inductor.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}