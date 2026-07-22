-- ADD EXTERNAL_ID TO AWARD_TYPES --
alter table award_types add column external_id text;
alter table award_types add constraint award_types_external_id_unique unique (external_id);