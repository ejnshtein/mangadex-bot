export default (chapter) => ` by ${chapter.group_name
  ? chapter.group_name
  : chapter.group_name_2
    ? chapter.group_name_2
    : chapter.group_name_3
      ? chapter.group_name_3
      : chapter.group_id
        ? chapter.group_id
        : chapter.group_id_2
          ? chapter.group_id_2
          : chapter.group_id_3
            ? chapter.group_id_3
            : chapter.id}`
