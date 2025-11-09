import axios from "axios";

export const getGoods = async (
  searchWord,
  resFormat = "catalog",
  page = 1,
  filterId
) => {
  try {
    console.log("начал запрос", searchWord, resFormat, page, filterId);

    const response = await axios.get(
      "https://www.wildberries.ru/__internal/u-search/exactmatch/ru/common/v18/search",
      {
        params: {
          ab_testing: "false",
          ab_testing: "false",
          appType: "1",
          curr: "rub",
          dest: "-1257786",
          hide_dtype: "11",
          inheritFilters: "false",
          lang: "ru",
          query: searchWord,
          resultset: resFormat,
          sort: "popular",
          spp: "30",
          suppressSpellcheck: "false",
          ...(filterId ? { xsubject: filterId } : {}),
          ...(!filterId ? { page: toString(page) } : {}),
        },
        headers: {
          accept: "*/*",
          "accept-language": "ru,en;q=0.9",
          origin: "https://www.wildberries.ru",
          priority: "u=1, i",
          referer:
            "https://www.wildberries.ru/catalog/0/search.aspx?search=%D0%B2%D0%B8%D0%B4%D0%B5%D0%BE%D0%BA%D0%B0%D1%80%D1%82%D0%B0%205060",
          "sec-ch-ua":
            '"Not)A;Brand";v="8", "Chromium";v="138", "YaBrowser";v="25.8", "Yowser";v="2.5"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "cross-site",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 YaBrowser/25.8.0.0 Safari/537.36",
          "x-pow":
            "2|site_68dd67682ba84e83a6196de81f973d5d|1761748218|8,8,1,bebb06000000000,edaa5392-f4fa-490a-aa26-1ee0d8d38543,af4d9768-d324-462c-9d05-899c7ee50b64,1761748276,1,6sWYvUlv9y6ibzglBIxVPDDo7O1/eUeeYdnoanwKAsc=,5fb52d40efdf67bea91f824a8e2c83b1254d065b79a91fe91238503d19205985a1af65b732a2989d3c82161f08823f311b6c6e378d1a4247fafde392b5d7668e|10",
          "x-queryid": "qid473991314174129109320251029143032",
          "x-userid": "0",
        },
      }
    );
    console.log(response);
    
    return response;
  } catch (error) {
    console.log(error);
  }
};
