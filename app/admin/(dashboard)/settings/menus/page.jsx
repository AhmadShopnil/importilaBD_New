"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Edit2,
  X,
  FolderTree,
  Check,
  RotateCcw,
  Menu as MenuIcon,
  Globe,
  Layers,
} from "lucide-react";
import toast from "react-hot-toast";
import { BASE_URL } from "@/utils/baseUrl";
import Loading from "@/components/Loader/Loading";

const PRESET_PAGES = [
  { label: "Home", url: "/" },
  { label: "Shop", url: "/shop" },
  { label: "Combo Packs", url: "/combo" },
  { label: "Terms & Conditions", url: "/terms-and-conditions" },
];

export default function MenuManagementPage() {
  const [menus, setMenus] = useState([]);
  const [selectedMenuId, setSelectedMenuId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCatCheckboxes, setSelectedCatCheckboxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Flatten categories for picker and bulk add
  const flatCategories = useMemo(() => {
    const flatten = (items, prefix = "") => {
      return items.reduce((acc, item) => {
        acc.push({
          ...item,
          displayName: prefix ? `${prefix} > ${item.name}` : item.name,
        });
        if (item.children && item.children.length > 0) {
          acc.push(...flatten(item.children, item.name));
        }
        return acc;
      }, []);
    };
    return flatten(categories || []);
  }, [categories]);

  // Modals
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [menuForm, setMenuForm] = useState({ title: "", slug: "", location: "header" });

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [itemForm, setItemForm] = useState({
    id: "",
    label: "",
    url: "/",
    badge: "",
    openInNewTab: false,
    children: [],
  });

  useEffect(() => {
    fetchMenus();
    fetchCategories();
  }, []);

  const fetchMenus = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/menus`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setMenus(data);
        if (data.length > 0 && !selectedMenuId) {
          setSelectedMenuId(data[0]._id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch menus:", error);
      toast.error("Failed to load menus");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const selectedMenu = menus.find((m) => m._id === selectedMenuId) || menus[0];

  /* ================== MENU (CONTAINER) ACTIONS ================== */
  const handleOpenCreateMenu = () => {
    setMenuForm({ title: "", slug: "", location: "header" });
    setIsMenuModalOpen(true);
  };

  const handleSaveMenuContainer = async () => {
    if (!menuForm.title.trim()) {
      toast.error("Menu title is required");
      return;
    }

    setSaving(true);
    try {
      const isEdit = Boolean(menuForm._id);
      const method = isEdit ? "PUT" : "POST";
      const payload = isEdit
        ? { _id: menuForm._id, title: menuForm.title, slug: menuForm.slug, location: menuForm.location }
        : { title: menuForm.title, slug: menuForm.slug, location: menuForm.location, items: [] };

      const res = await fetch(`${BASE_URL}/api/menus`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (res.ok) {
        const saved = await res.json();
        toast.success(`Menu "${menuForm.title}" ${isEdit ? "updated" : "created"}!`);
        setIsMenuModalOpen(false);
        await fetchMenus();
        if (!isEdit && saved._id) {
          setSelectedMenuId(saved._id);
        }
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save menu");
      }
    } catch (error) {
      console.error("Save menu container error:", error);
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMenuContainer = async (menuId, menuTitle) => {
    if (!confirm(`Are you sure you want to delete the entire menu "${menuTitle}"?`)) return;

    try {
      const res = await fetch(`${BASE_URL}/api/menus?id=${menuId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        toast.success(`Menu "${menuTitle}" deleted!`);
        const updated = menus.filter((m) => m._id !== menuId);
        setMenus(updated);
        if (updated.length > 0) {
          setSelectedMenuId(updated[0]._id);
        } else {
          setSelectedMenuId(null);
        }
      } else {
        toast.error("Failed to delete menu");
      }
    } catch (error) {
      console.error("Delete menu error:", error);
      toast.error("An error occurred");
    }
  };

  /* ================== MENU ITEM (LINK) ACTIONS ================== */
  const handleOpenAddItem = () => {
    setItemForm({
      id: `item-${Date.now()}`,
      label: "",
      url: "/",
      badge: "",
      openInNewTab: false,
      children: [],
    });
    setEditingItemIndex(null);
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item, index) => {
    setItemForm({
      ...item,
      children: Array.isArray(item.children) ? [...item.children] : [],
    });
    setEditingItemIndex(index);
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async () => {
    if (!itemForm.label.trim() || !itemForm.url.trim()) {
      toast.error("Please provide both Label and URL");
      return;
    }

    if (!selectedMenu) return;

    const currentItems = Array.isArray(selectedMenu.items) ? [...selectedMenu.items] : [];

    if (editingItemIndex !== null && editingItemIndex >= 0) {
      // Update existing item
      currentItems[editingItemIndex] = itemForm;
    } else {
      // Add new item
      currentItems.push(itemForm);
    }

    const updatedMenu = { ...selectedMenu, items: currentItems };

    try {
      const res = await fetch(`${BASE_URL}/api/menus`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedMenu),
        credentials: "include",
      });

      if (res.ok) {
        setMenus((prev) => prev.map((m) => (m._id === selectedMenu._id ? updatedMenu : m)));
        toast.success(editingItemIndex !== null ? "Link updated" : "Link added to menu");
        setIsItemModalOpen(false);
      } else {
        toast.error("Failed to update menu items");
      }
    } catch (error) {
      console.error("Failed to save item:", error);
      toast.error("An error occurred");
    }
  };

  const handleDeleteItem = async (index) => {
    if (!confirm("Are you sure you want to remove this link?")) return;
    if (!selectedMenu) return;

    const currentItems = selectedMenu.items.filter((_, i) => i !== index);
    const updatedMenu = { ...selectedMenu, items: currentItems };

    try {
      const res = await fetch(`${BASE_URL}/api/menus`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedMenu),
        credentials: "include",
      });

      if (res.ok) {
        setMenus((prev) => prev.map((m) => (m._id === selectedMenu._id ? updatedMenu : m)));
        toast.success("Link removed");
      } else {
        toast.error("Failed to delete link");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleMoveItem = async (index, direction) => {
    if (!selectedMenu) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= selectedMenu.items.length) return;

    const reordered = [...selectedMenu.items];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    const updatedMenu = { ...selectedMenu, items: reordered };

    setMenus((prev) => prev.map((m) => (m._id === selectedMenu._id ? updatedMenu : m)));

    try {
      await fetch(`${BASE_URL}/api/menus`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedMenu),
        credentials: "include",
      });
      toast.success("Order updated");
    } catch (error) {
      toast.error("Failed to update order");
      fetchMenus();
    }
  };

  /* ================== SUBMENU CHILD HANDLERS ================== */
  const handleAddChild = () => {
    setItemForm((prev) => ({
      ...prev,
      children: [
        ...(prev.children || []),
        { id: `sub-${Date.now()}`, label: "", url: "/shop", openInNewTab: false },
      ],
    }));
  };

  const handleUpdateChild = (idx, field, value) => {
    const updated = [...(itemForm.children || [])];
    updated[idx][field] = value;
    setItemForm((prev) => ({ ...prev, children: updated }));
  };

  const handleRemoveChild = (idx) => {
    const updated = (itemForm.children || []).filter((_, i) => i !== idx);
    setItemForm((prev) => ({ ...prev, children: updated }));
  };

  /* ================== BULK ADD CATEGORIES TO MENU ================== */
  const handleAddCategoriesToMenu = async (catIds) => {
    if (!selectedMenu) {
      toast.error("Please select a menu first");
      return;
    }
    if (!catIds || catIds.length === 0) {
      toast.error("Please select at least one category");
      return;
    }

    const catsToAdd = flatCategories.filter((c) => catIds.includes(c._id));
    if (catsToAdd.length === 0) return;

    setSaving(true);
    const newItems = catsToAdd.map((cat, idx) => ({
      id: `item-${Date.now()}-${idx}-${cat._id.slice(-4)}`,
      label: cat.name,
      url: `/category/${cat.slug || cat._id}`,
      badge: "",
      openInNewTab: false,
      children: [],
    }));

    const currentItems = Array.isArray(selectedMenu.items) ? [...selectedMenu.items] : [];
    const updatedMenu = { ...selectedMenu, items: [...currentItems, ...newItems] };

    try {
      const res = await fetch(`${BASE_URL}/api/menus`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedMenu),
        credentials: "include",
      });

      if (res.ok) {
        setMenus((prev) => prev.map((m) => (m._id === selectedMenu._id ? updatedMenu : m)));
        toast.success(`Added ${newItems.length} categories to "${selectedMenu.title}"!`);
        setSelectedCatCheckboxes([]);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to add categories to menu");
      }
    } catch (error) {
      console.error("Add categories error:", error);
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="bg-white rounded-md border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Menus & Navigation
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Create and organize multiple distinct menus (Header, Footer, Custom) and configure links for each.
          </p>
        </div>
        <button
          onClick={handleOpenCreateMenu}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#1C546D] hover:bg-[#164458] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Menu</span>
        </button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Menu Selector / Switcher (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white rounded-md border border-gray-200 p-3">
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide block mb-2 px-1">
              Your Menus ({menus.length})
            </span>
            <div className="space-y-1.5">
              {menus.map((m) => {
                const isSelected = m._id === selectedMenuId;
                const itemsCount = m.items?.length || 0;

                return (
                  <button
                    key={m._id}
                    onClick={() => setSelectedMenuId(m._id)}
                    className={`w-full text-left p-3 rounded-md border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "border-[#1C546D] bg-[#1C546D]/5 ring-1 ring-[#1C546D]"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">
                          {m.title}
                        </span>
                        <span className="px-1.5 py-0.2 bg-gray-100 text-gray-600 text-[10px] font-semibold rounded uppercase">
                          {m.location}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 font-mono">
                        slug: {m.slug}
                      </p>
                    </div>

                    <span className="text-xs font-semibold text-[#1C546D] bg-white px-2 py-0.5 rounded border border-gray-200">
                      {itemsCount} {itemsCount === 1 ? "link" : "links"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Add Categories Panel */}
          <div className="bg-white rounded-md border border-gray-200 p-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5 text-[#1C546D]" /> Add Categories
              </span>
              <span className="text-[11px] text-gray-400">
                {flatCategories.length} items
              </span>
            </div>

            <p className="text-[11px] text-gray-500">
              Select categories to add to{" "}
              <span className="font-semibold text-gray-800">
                {selectedMenu ? `"${selectedMenu.title}"` : "menu"}
              </span>
            </p>

            {/* Checkboxes List */}
            <div className="space-y-1 max-h-52 overflow-y-auto border border-gray-100 rounded-md p-2 bg-gray-50/50 divide-y divide-gray-100">
              {flatCategories.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-3">No categories found</p>
              ) : (
                flatCategories.map((cat) => {
                  const isChecked = selectedCatCheckboxes.includes(cat._id);
                  return (
                    <label
                      key={cat._id}
                      className="flex items-center gap-2 py-1.5 px-1 rounded hover:bg-white text-xs text-gray-700 cursor-pointer select-none transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCatCheckboxes((prev) => [...prev, cat._id]);
                          } else {
                            setSelectedCatCheckboxes((prev) =>
                              prev.filter((id) => id !== cat._id)
                            );
                          }
                        }}
                        className="rounded text-[#1C546D] focus:ring-[#1C546D]"
                      />
                      <span className="truncate">{cat.displayName || cat.name}</span>
                    </label>
                  );
                })
              )}
            </div>

            {/* Panel Actions */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCatCheckboxes(flatCategories.map((c) => c._id))}
                  className="text-[11px] text-gray-500 hover:text-gray-900 cursor-pointer font-medium"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedCatCheckboxes([])}
                  className="text-[11px] text-gray-500 hover:text-gray-900 cursor-pointer font-medium"
                >
                  Deselect
                </button>
              </div>

              <button
                type="button"
                disabled={selectedCatCheckboxes.length === 0 || !selectedMenu || saving}
                onClick={() => handleAddCategoriesToMenu(selectedCatCheckboxes)}
                className="px-2.5 py-1.5 rounded-md bg-[#1C546D] hover:bg-[#164458] text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-xs"
              >
                + Add ({selectedCatCheckboxes.length})
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Active Menu Details & Links (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedMenu ? (
            <div className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-xs">
              {/* Menu Details Bar */}
              <div className="p-4 bg-gray-50/80 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-gray-900">
                      {selectedMenu.title}
                    </h2>
                    <span className="px-2 py-0.5 bg-[#1C546D] text-white text-[10px] font-bold rounded uppercase">
                      {selectedMenu.location === "header"
                        ? "Header Menu"
                        : selectedMenu.location === "footer"
                        ? "Footer Menu"
                        : "Custom Menu"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Handle: <span className="font-mono">{selectedMenu.slug}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setMenuForm(selectedMenu);
                      setIsMenuModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-medium cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Settings</span>
                  </button>
                  <button
                    onClick={() =>
                      handleDeleteMenuContainer(selectedMenu._id, selectedMenu.title)
                    }
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Menu</span>
                  </button>
                </div>
              </div>

              {/* Links Header with "Add Link" Button */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Menu Items ({selectedMenu.items?.length || 0})
                </span>
                <button
                  onClick={handleOpenAddItem}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1C546D] hover:bg-[#164458] text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Link</span>
                </button>
              </div>

              {/* Items List */}
              {!selectedMenu.items || selectedMenu.items.length === 0 ? (
                <div className="p-8 text-center text-gray-500 space-y-2">
                  <p className="text-sm font-medium">This menu currently has no links</p>
                  <button
                    onClick={handleOpenAddItem}
                    className="text-xs text-[#1C546D] font-bold hover:underline cursor-pointer"
                  >
                    + Add your first link to {selectedMenu.title}
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {selectedMenu.items.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/70 transition-colors"
                    >
                      {/* Left: Reorder & Info */}
                      <div className="flex items-start sm:items-center gap-3 flex-1">
                        <div className="flex flex-col gap-0.5 shrink-0 pt-0.5 sm:pt-0">
                          <button
                            disabled={index === 0}
                            onClick={() => handleMoveItem(index, "up")}
                            className="p-1 rounded text-gray-400 hover:text-gray-900 hover:bg-gray-200 disabled:opacity-20 cursor-pointer"
                            title="Move Up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={index === selectedMenu.items.length - 1}
                            onClick={() => handleMoveItem(index, "down")}
                            className="p-1 rounded text-gray-400 hover:text-gray-900 hover:bg-gray-200 disabled:opacity-20 cursor-pointer"
                            title="Move Down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-gray-900">
                              {item.label}
                            </span>
                            {item.badge && (
                              <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 text-[10px] font-extrabold rounded">
                                {item.badge}
                              </span>
                            )}
                            {item.openInNewTab && (
                              <span title="Opens in new tab" className="text-gray-400">
                                <ExternalLink className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 font-mono">
                            {item.url}
                          </p>

                          {/* Nested Sub-links Preview */}
                          {item.children?.length > 0 && (
                            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                              {item.children.map((child, cIdx) => (
                                <span
                                  key={cIdx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-[11px] font-medium rounded border border-gray-200"
                                >
                                  <span>↳ {child.label}</span>
                                  <span className="text-[10px] text-gray-400">
                                    ({child.url})
                                  </span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        <button
                          onClick={() => handleOpenEditItem(item, index)}
                          className="p-1.5 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                          title="Edit Link"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(index)}
                          className="p-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remove Link"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-md border border-gray-200 p-12 text-center text-gray-500 space-y-3">
              <p className="text-sm font-semibold text-gray-800">No menu selected</p>
              <button
                onClick={handleOpenCreateMenu}
                className="px-4 py-2 rounded-md bg-[#1C546D] text-white text-xs font-bold"
              >
                + Create Your First Menu
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL: CREATE / EDIT MENU CONTAINER ================= */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-gray-200 shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">
                {menuForm._id ? "Edit Menu Settings" : "Create New Menu"}
              </h3>
              <button
                onClick={() => setIsMenuModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">
                  Menu Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Main Navigation, Footer Links, Help Menu"
                  value={menuForm.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    const slug = title
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/(^-|-$)/g, "");
                    setMenuForm((prev) => ({
                      ...prev,
                      title,
                      slug: prev._id ? prev.slug : slug,
                    }));
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:outline-none focus:border-gray-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">
                  Handle / Slug
                </label>
                <input
                  type="text"
                  placeholder="e.g. main-menu, footer-menu"
                  value={menuForm.slug}
                  onChange={(e) => setMenuForm({ ...menuForm, slug: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md font-mono focus:bg-white focus:outline-none focus:border-gray-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">
                  Storefront Placement
                </label>
                <select
                  value={menuForm.location || "header"}
                  onChange={(e) => setMenuForm({ ...menuForm, location: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 cursor-pointer"
                >
                  <option value="header">Header Navigation (Top Bar)</option>
                  <option value="footer">Footer Navigation</option>
                  <option value="custom">Custom Menu</option>
                </select>
                <p className="text-[11px] text-gray-400">
                  &quot;Header Navigation&quot; displays in the storefront header navbar. &quot;Footer Navigation&quot; displays in the footer.
                </p>
              </div>
            </div>

            <div className="p-3 border-t border-gray-100 flex items-center justify-end gap-2 bg-gray-50">
              <button
                type="button"
                onClick={() => setIsMenuModalOpen(false)}
                className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveMenuContainer}
                disabled={saving}
                className="px-4 py-1.5 rounded-md bg-[#1C546D] hover:bg-[#164458] text-white text-xs font-semibold disabled:opacity-50"
              >
                {saving ? "Saving..." : menuForm._id ? "Update Menu" : "Create Menu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT MENU ITEM (LINK) ================= */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-gray-200 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">
                {editingItemIndex !== null ? "Edit Link" : "Add Link to Menu"}
              </h3>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5">
              {/* Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  Quick Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_PAGES.map((p) => (
                    <button
                      key={p.url}
                      type="button"
                      onClick={() => setItemForm({ ...itemForm, label: p.label, url: p.url })}
                      className="px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-medium cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                  {flatCategories.map((cat) => (
                    <button
                      key={cat._id}
                      type="button"
                      onClick={() =>
                        setItemForm({
                          ...itemForm,
                          label: cat.name,
                          url: `/category/${cat.slug || cat._id}`,
                        })
                      }
                      className="px-2 py-0.5 rounded bg-sky-50 hover:bg-sky-100 text-sky-800 text-[11px] font-medium cursor-pointer transition-colors"
                    >
                      📁 {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Dropdown Auto-Filler */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">
                  Link to Category (Auto-fills Label & URL)
                </label>
                <select
                  onChange={(e) => {
                    const catId = e.target.value;
                    if (!catId) return;
                    const found = flatCategories.find((c) => c._id === catId);
                    if (found) {
                      setItemForm((prev) => ({
                        ...prev,
                        label: found.name,
                        url: `/category/${found.slug || found._id}`,
                      }));
                    }
                  }}
                  defaultValue=""
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:outline-none focus:border-gray-400 cursor-pointer"
                >
                  <option value="">-- Or choose a category to auto-fill --</option>
                  {flatCategories.map((c) => (
                    <option key={c._id} value={c._id}>
                      📁 {c.displayName || c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Label & URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">
                    Link Label *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Shop, Combos, About"
                    value={itemForm.label}
                    onChange={(e) => setItemForm({ ...itemForm, label: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:outline-none focus:border-gray-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">
                    Destination URL *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. /shop, /combo, https://..."
                    value={itemForm.url}
                    onChange={(e) => setItemForm({ ...itemForm, url: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:outline-none focus:border-gray-400 font-mono"
                  />
                </div>
              </div>

              {/* Highlight Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">
                    Highlight Badge (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hot, Sale, New"
                    value={itemForm.badge || ""}
                    onChange={(e) => setItemForm({ ...itemForm, badge: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:outline-none focus:border-gray-400"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={itemForm.openInNewTab}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, openInNewTab: e.target.checked })
                      }
                      className="rounded text-[#1C546D]"
                    />
                    <span>Open in new tab</span>
                  </label>
                </div>
              </div>

              {/* Sub-menu (Children) */}
              <div className="space-y-2 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <FolderTree className="w-3.5 h-3.5 text-[#1C546D]" />
                    <span>Sub-Menu Links (Dropdown)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddChild}
                    className="text-xs text-[#1C546D] font-bold hover:underline cursor-pointer"
                  >
                    + Add Sub-Item
                  </button>
                </div>

                {itemForm.children?.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {itemForm.children.map((child, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-1.5 rounded bg-gray-50 border border-gray-200"
                      >
                        <input
                          type="text"
                          placeholder="Label (e.g. Boys Wear)"
                          value={child.label}
                          onChange={(e) => handleUpdateChild(idx, "label", e.target.value)}
                          className="flex-1 px-2 py-1 text-xs bg-white border border-gray-200 rounded"
                        />
                        <input
                          type="text"
                          placeholder="URL (e.g. /category/boys)"
                          value={child.url}
                          onChange={(e) => handleUpdateChild(idx, "url", e.target.value)}
                          className="flex-1 px-2 py-1 text-xs bg-white border border-gray-200 rounded font-mono"
                        />
                        <select
                          onChange={(e) => {
                            const catId = e.target.value;
                            if (!catId) return;
                            const found = flatCategories.find((c) => c._id === catId);
                            if (found) {
                              handleUpdateChild(idx, "label", found.name);
                              handleUpdateChild(
                                idx,
                                "url",
                                `/category/${found.slug || found._id}`
                              );
                            }
                          }}
                          defaultValue=""
                          className="w-24 text-[10px] bg-white border border-gray-200 rounded px-1 py-1 text-gray-600 cursor-pointer"
                        >
                          <option value="">📁 Pick Cat</option>
                          {flatCategories.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRemoveChild(idx)}
                          className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-400">
                    No sub-items. Click &quot;+ Add Sub-Item&quot; to create a hover dropdown menu for this link.
                  </p>
                )}
              </div>
            </div>

            <div className="p-3 border-t border-gray-100 flex items-center justify-end gap-2 bg-gray-50">
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveItem}
                className="px-4 py-1.5 rounded-md bg-[#1C546D] hover:bg-[#164458] text-white text-xs font-semibold"
              >
                Save Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
