import React, { useState, useEffect } from "react";
import { X, Send, History, Clock, User } from "lucide-react";
import axios from "axios";

const CATEGORY_COLORS = {
  Maintenance: "bg-red-100 text-red-700 border-red-200",
  Greasing: "bg-amber-100 text-amber-700 border-amber-200",
  Inspection: "bg-purple-100 text-purple-700 border-purple-200",
  General: "bg-cyan-100 text-cyan-700 border-cyan-200",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-base font-extrabold text-cyan-700 uppercase tracking-wide">
              {inductor.title}
            </h2>
            <p className="text-xs text-slate-500">Add operational logs and view historical remarks</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* ADD REMARK FORM */}
          <form onSubmit={handleSave} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-bold text-slate-700">New Remark Entry</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 outline-none focus:border-cyan-600"
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
              className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-800 outline-none focus:border-cyan-600 resize-none"
            ></textarea>

            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-sm"
              >
                <Send size={13} /> Save Remark
              </button>
            </div>
          </form>

          {/* COLORFUL HISTORY TIMELINE */}
          <div>
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2 mb-4">
              <History size={14} className="text-cyan-600" />
              Remark History Logs ({remarksList.length})
            </h3>

            {loading ? (
              <div className="text-center py-6 text-xs text-slate-500">Loading history...</div>
            ) : remarksList.length > 0 ? (
              <div className="space-y-3 relative border-l-2 border-slate-200 ml-3 pl-4">
                {remarksList.map((item) => (
                  <div
                    key={item._id}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3 relative group hover:border-slate-300 transition-all"
                  >
                    <div className="absolute -left-[23px] top-4 w-3 h-3 rounded-full bg-cyan-600 border-2 border-white"></div>

                    <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          CATEGORY_COLORS[item.category] || CATEGORY_COLORS.General
                        }`}
                      >
                        {item.category}
                      </span>
                      <div className="flex items-center gap-3 text-[10px] text-slate-600">
                        <span className="flex items-center gap-1">
                          <User size={10} /> {item.createdBy}
                        </span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Clock size={10} /> {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-800 leading-relaxed">{item.remark}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                No history remarks recorded yet for this inductor.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}