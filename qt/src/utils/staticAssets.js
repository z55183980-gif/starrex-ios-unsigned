/**
 * 本地 /assets/img 下缺失文件时的回退（仓库内仅有部分 SVG，完整素材需放到 public/assets/img）
 */
const IMG_FALLBACKS = {
  '/assets/img/icon_dt_1gg.avif': '/assets/img/style_3_icon_top_xx.svg',
  '/assets/img/icon_dt_1xx.avif': '/assets/img/style_3_icon_top_xx.svg',
  '/assets/img/icon_dt_1xx_wd.avif': '/assets/img/style_3_icon_top_xxyd.svg',
  '/assets/img/kjrk_icon_guanbi.avif': '/assets/img/comm_icon_hide.svg',
  '/assets/img/icon_dtfl_rm_1.avif': '/assets/img/icon_dtfl_zh_0.svg',
  '/assets/img/icon_dtfl_dz_1.avif': '/assets/img/icon_dtfl_dz_0.svg',
  '/assets/img/icon_dtfl_zr_1.avif': '/assets/img/icon_dtfl_zr_0.svg',
  '/assets/img/icon_dtfl_by_1.avif': '/assets/img/icon_dtfl_by_0.svg',
  '/assets/img/icon_dtfl_qp_1.avif': '/assets/img/icon_dtfl_qp_0.svg',
  '/assets/img/icon_dtfl_cp_1.avif': '/assets/img/icon_dtfl_cp_0.svg',
  '/assets/img/icon_dtfl_ty_1.avif': '/assets/img/icon_dtfl_ty_0.svg',
  '/assets/img/icon_dtfl_dj_1.avif': '/assets/img/icon_dtfl_dj_0.svg',
  '/assets/img/icon_dtfl_qkl_1.avif': '/assets/img/icon_dtfl_dz_0.svg',
  '/assets/img/icon_dtfl_dz_1.avif': '/assets/img/icon_dtfl_dz_0.svg',
  '/assets/images/user/avatars/logo.png': '/assets/img/icon_sys_menu_service.svg'
}

/** 将可能 404 的静态路径映射为仓库内已有资源 */
export function resolveStaticAsset(path) {
  if (!path || typeof path !== 'string') return path
  const key = path.split('?')[0]
  if (IMG_FALLBACKS[key] !== undefined) return IMG_FALLBACKS[key]
  return path
}

/** 图片加载失败时隐藏节点，避免控制台刷 404 */
export function hideBrokenImg(event) {
  const el = event?.target
  if (!el || el.dataset.hiddenOnError) return
  el.dataset.hiddenOnError = '1'
  el.style.display = 'none'
}
