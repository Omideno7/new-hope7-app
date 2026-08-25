create or replace function public.nh7_admin_books_review_v362(p_book_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $$
declare
  v_allowed boolean;
  v_item public.nh7_library_items;
  v_books jsonb;
begin
  v_allowed := public.nh7_admin_is_admin();
  if not coalesce(v_allowed,false) then
    raise exception 'NH7_ADMIN_REQUIRED';
  end if;

  if p_book_id is null then
    select coalesce(jsonb_agg(jsonb_build_object(
      'id',x.id,
      'title_fa',x.title_fa,
      'title_en',x.title_en,
      'title_hr',x.title_hr,
      'reader_status',x.reader_status,
      'reader_page_count',x.reader_page_count,
      'reader_language',x.reader_language,
      'is_published',x.is_published,
      'available_languages',jsonb_build_array(
        case when length(trim(coalesce(x.reader_text->'fa'->>'text','')))>0 then 'fa' end,
        case when length(trim(coalesce(x.reader_text->'en'->>'text','')))>0 then 'en' end,
        case when length(trim(coalesce(x.reader_text->'hr'->>'text','')))>0 then 'hr' end
      )
    ) order by x.sort_order,x.title_en),'[]'::jsonb)
    into v_books
    from public.nh7_library_items x
    where x.title_en in (
      'The Holy Spirit & You',
      'Join This Chariot',
      'The Counter Attack — Revised Edition',
      'When God Visits You',
      'How to Receive a Miracle and Retain It',
      'Don''t Stop Here! — A Spiritual Journey to Greater Impact',
      'Praying the Right Way',
      'How to Pray Effectively — Volume One',
      'Seven Things the Holy Spirit Will Do in You'
    ) and x.reader_status='ready';
    return jsonb_build_object('ok',true,'books',v_books);
  end if;

  select * into v_item
  from public.nh7_library_items x
  where x.id=p_book_id
    and x.title_en in (
      'The Holy Spirit & You',
      'Join This Chariot',
      'The Counter Attack — Revised Edition',
      'When God Visits You',
      'How to Receive a Miracle and Retain It',
      'Don''t Stop Here! — A Spiritual Journey to Greater Impact',
      'Praying the Right Way',
      'How to Pray Effectively — Volume One',
      'Seven Things the Holy Spirit Will Do in You'
    )
    and x.reader_status='ready';

  if not found then
    return jsonb_build_object('ok',false,'code','not_found');
  end if;

  return jsonb_build_object(
    'ok',true,
    'book',jsonb_build_object(
      'id',v_item.id,
      'title_fa',v_item.title_fa,
      'title_en',v_item.title_en,
      'title_hr',v_item.title_hr,
      'reader_status',v_item.reader_status,
      'reader_page_count',v_item.reader_page_count,
      'reader_language',v_item.reader_language,
      'reader_text',v_item.reader_text
    )
  );
end;
$$;

revoke all on function public.nh7_admin_books_review_v362(uuid) from public;
grant execute on function public.nh7_admin_books_review_v362(uuid) to authenticated;
