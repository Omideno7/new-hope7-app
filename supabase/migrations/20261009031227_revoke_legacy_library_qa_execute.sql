revoke execute on function public.nh7_qa_library_catalog_v363() from public;
revoke execute on function public.nh7_qa_library_catalog_v363() from anon;
grant execute on function public.nh7_qa_library_catalog_v363() to authenticated;
grant execute on function public.nh7_qa_library_catalog_v363() to service_role;

revoke execute on function public.nh7_qa_library_reader_access_v363(uuid, text) from public;
revoke execute on function public.nh7_qa_library_reader_access_v363(uuid, text) from anon;
grant execute on function public.nh7_qa_library_reader_access_v363(uuid, text) to authenticated;
grant execute on function public.nh7_qa_library_reader_access_v363(uuid, text) to service_role;