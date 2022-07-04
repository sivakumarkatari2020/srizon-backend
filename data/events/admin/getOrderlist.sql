
SELECT TOP 100 [id]
    ,[user_id]
    ,[product_id]
    ,[order_id]
    ,[payment_id]
    ,[payment_signature]
    ,[total]
    ,[quantity]
    ,[status]
    ,[track_id]
    ,[shipping_id]
    ,[created_at]
    ,[modified_at]
FROM [dbo].[order_details]
ORDER By [id] DESC