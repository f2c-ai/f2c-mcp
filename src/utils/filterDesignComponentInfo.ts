interface DesignComponentSetInfo {
  key: String;
  thumbnail_url: String;
  name: String;
  description: String;
}

export function filterDesignComponentSetInfo(
  componentSetsInfo: DesignComponentSetInfo[]
) {
  return componentSetsInfo.map((item) => ({
    key: item.key,
    thumbnailUrl: item.thumbnail_url,
    name: item.name,
    description: item.description,
  }));
}
