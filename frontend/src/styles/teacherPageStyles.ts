/**
 * 教师端页面统一设计规范
 * 用于确保所有教师端功能页面的UI风格一致
 */

export const TEACHER_PAGE_STYLES = {
  // 页面容器
  pageContainer: "h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50",
  
  // Header区域
  header: {
    container: "px-8 py-6 bg-white/80 backdrop-blur-sm border-b border-slate-200/60",
    wrapper: "flex items-center justify-between",
    titleSection: "",
    title: "text-2xl font-bold text-slate-900",
    subtitle: "text-sm text-slate-600 mt-0.5",
    actionButton: "px-5 py-2.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-slate-900/20 flex items-center gap-2",
    secondaryButton: "px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-all duration-200 flex items-center gap-2",
  },
  
  // 工具栏
  toolbar: {
    container: "px-8 py-4 bg-white/60 backdrop-blur-sm border-b border-slate-200/60",
    wrapper: "flex items-center justify-between",
    leftSection: "flex items-center gap-4",
    rightSection: "flex items-center gap-6 text-sm text-slate-600",
    searchBox: {
      container: "relative",
      input: "w-80 pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all",
      icon: "w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400",
    },
    select: "px-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all bg-white",
    statDot: "w-2 h-2 rounded-full bg-slate-400",
  },
  
  // 内容区域
  content: {
    container: "flex-1 overflow-y-auto p-8",
    loadingWrapper: "flex items-center justify-center h-64",
    loadingSpinner: "inline-block animate-spin rounded-full h-10 w-10 border-3 border-slate-300 border-t-slate-900 mb-4",
    loadingText: "text-sm text-slate-600",
    emptyWrapper: "flex items-center justify-center h-64",
    emptyIcon: "w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center",
    emptyIconSvg: "w-8 h-8 text-slate-400",
    emptyTitle: "text-slate-600 font-medium mb-1",
    emptySubtitle: "text-sm text-slate-500",
  },
  
  // 卡片列表
  cardList: {
    container: "space-y-3",
    card: "group bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-md transition-all duration-200",
    cardHeader: "flex items-center justify-between",
    cardIcon: "flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center border border-slate-200",
    cardIconSvg: "w-6 h-6 text-slate-600",
    cardContent: "flex-1",
    cardTitle: "text-base font-semibold text-slate-900 mb-1.5",
    cardMeta: "flex items-center gap-6 text-sm text-slate-600",
    cardMetaItem: "flex items-center gap-1.5",
    cardMetaIcon: "w-4 h-4 text-slate-400",
    cardMetaLabel: "font-medium",
    cardMetaValue: "text-slate-500",
    cardActions: "flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity",
    cardActionButton: "px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5",
    cardActionButtonDelete: "px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5",
    actionIcon: "w-4 h-4",
  },
  
  // Modal表单
  modal: {
    content: "p-6 space-y-5",
    formGroup: "",
    label: "block text-sm font-medium text-slate-700 mb-2",
    requiredStar: "text-red-600",
    input: "w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all",
    select: "w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all",
    textarea: "w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all resize-none",
    gridCols2: "grid grid-cols-2 gap-4",
    footer: "flex justify-end gap-3 pt-4 border-t border-slate-200",
    cancelButton: "px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors",
    submitButton: "px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors",
  },
  
  // 分页
  pagination: {
    container: "flex items-center justify-between pt-4 border-t border-slate-200",
    info: "text-sm text-slate-600",
    controls: "flex items-center gap-2",
    button: "px-3 py-1.5 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
    buttonActive: "px-3 py-1.5 text-sm font-medium bg-slate-900 text-white border border-slate-900 rounded-lg",
  },
  
  // 图标大小
  icons: {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    base: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-8 h-8",
  },
  
  // 颜色系统
  colors: {
    primary: "slate-900",
    secondary: "slate-700",
    border: "slate-200",
    background: "slate-50",
    text: {
      primary: "slate-900",
      secondary: "slate-600",
      tertiary: "slate-500",
    },
  },
};

// 字体大小规范
export const FONT_SIZES = {
  xs: "text-xs",      // 10-11px
  sm: "text-sm",      // 14px
  base: "text-base",  // 16px
  lg: "text-lg",      // 18px
  xl: "text-xl",      // 20px
  "2xl": "text-2xl",  // 24px
  "3xl": "text-3xl",  // 30px
};

// 字重规范
export const FONT_WEIGHTS = {
  normal: "font-normal",    // 400
  medium: "font-medium",    // 500
  semibold: "font-semibold", // 600
  bold: "font-bold",        // 700
};

// 间距规范
export const SPACING = {
  xs: "gap-1",     // 4px
  sm: "gap-2",     // 8px
  base: "gap-3",   // 12px
  lg: "gap-4",     // 16px
  xl: "gap-6",     // 24px
  "2xl": "gap-8",  // 32px
};

// 圆角规范
export const BORDER_RADIUS = {
  sm: "rounded",      // 4px
  base: "rounded-lg", // 8px
  lg: "rounded-xl",   // 12px
  full: "rounded-full", // 9999px
};

