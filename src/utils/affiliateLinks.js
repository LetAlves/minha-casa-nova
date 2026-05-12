import {
  ML_AFFILIATE_ID,
  LOMADEE_SOURCE_ID,
  LOMADEE_MERCHANTS,
  SHOPEE_OFFER_ID,
} from '../config/affiliates'

export const getMercadoLivreUrl = (permalink) => {
  if (!permalink) return null
  if (!ML_AFFILIATE_ID) return permalink
  const sep = permalink.includes('?') ? '&' : '?'
  return `${permalink}${sep}partner_id=${ML_AFFILIATE_ID}&source=afiliado`
}

export const getStoreSearchUrl = (storeKey, query) => {
  const q = encodeURIComponent(query)

  const baseUrls = {
    casasBahia:    `https://www.casasbahia.com.br/busca/${q}`,
    magazineLuiza: `https://www.magazineluiza.com.br/busca/${q}/`,
    madeiraMadeira:`https://www.madeiramadeira.com.br/busca/?q=${q}`,
    tokStok:       `https://www.tokstok.com.br/busca?q=${q}`,
    leroyMerlin:   `https://www.leroymerlin.com.br/pesquisa/?q=${q}`,
    shopee:        `https://shopee.com.br/search?keyword=${q}`,
    google:        `https://www.google.com.br/search?q=${q}&tbm=shop`,
  }

  const base = baseUrls[storeKey]

  if (LOMADEE_SOURCE_ID && LOMADEE_MERCHANTS[storeKey]) {
    const mid = LOMADEE_MERCHANTS[storeKey]
    return `https://www.lomadee.com/link/${LOMADEE_SOURCE_ID}/${mid}/_/${encodeURIComponent(base)}`
  }

  if (storeKey === 'shopee' && SHOPEE_OFFER_ID) {
    return `https://shopee.com.br/search?keyword=${q}&offer_id=${SHOPEE_OFFER_ID}`
  }

  return base
}
