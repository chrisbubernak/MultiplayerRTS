/****** Object:  Table [dbo].[User]    Script Date: 1/28/2015 6:41:15 AM ******/
DROP TABLE [dbo].[User]
GO
/****** Object:  Table [dbo].[LobbyUser]    Script Date: 1/28/2015 6:41:15 AM ******/
DROP TABLE [dbo].[LobbyUser]
GO
/****** Object:  Table [dbo].[GameReport]    Script Date: 1/28/2015 6:41:15 AM ******/
DROP TABLE [dbo].[GameReport]
GO
/****** Object:  Table [dbo].[Game]    Script Date: 1/28/2015 6:41:15 AM ******/
DROP TABLE [dbo].[Game]
GO
/****** Object:  StoredProcedure [dbo].[User_RemoveFromLobby]    Script Date: 1/28/2015 6:41:15 AM ******/
DROP PROCEDURE [dbo].[User_RemoveFromLobby]
GO
/****** Object:  StoredProcedure [dbo].[User_Login]    Script Date: 1/28/2015 6:41:15 AM ******/
DROP PROCEDURE [dbo].[User_Login]
GO
/****** Object:  StoredProcedure [dbo].[User_GetAllInLobby]    Script Date: 1/28/2015 6:41:15 AM ******/
DROP PROCEDURE [dbo].[User_GetAllInLobby]
GO
/****** Object:  StoredProcedure [dbo].[User_Get]    Script Date: 1/28/2015 6:41:15 AM ******/
DROP PROCEDURE [dbo].[User_Get]
GO
/****** Object:  StoredProcedure [dbo].[User_AddToLobby]    Script Date: 1/28/2015 6:41:15 AM ******/
DROP PROCEDURE [dbo].[User_AddToLobby]
GO
/****** Object:  StoredProcedure [dbo].[User_Add]    Script Date: 1/28/2015 6:41:15 AM ******/
DROP PROCEDURE [dbo].[User_Add]
GO
/****** Object:  StoredProcedure [dbo].[LobbyUser_RemoveAll]    Script Date: 1/28/2015 6:41:15 AM ******/
DROP PROCEDURE [dbo].[LobbyUser_RemoveAll]
GO
/****** Object:  StoredProcedure [dbo].[LobbyUser_Get]    Script Date: 1/28/2015 6:41:15 AM ******/
DROP PROCEDURE [dbo].[LobbyUser_Get]
GO
/****** Object:  StoredProcedure [dbo].[GameReports_Get]    Script Date: 1/28/2015 6:41:15 AM ******/
DROP PROCEDURE [dbo].[GameReports_Get]
GO
/****** Object:  StoredProcedure [dbo].[GameReport_Add]    Script Date: 1/28/2015 6:41:15 AM ******/
DROP PROCEDURE [dbo].[GameReport_Add]
GO
/****** Object:  StoredProcedure [dbo].[GameActions_Get]    Script Date: 1/28/2015 6:41:15 AM ******/
DROP PROCEDURE [dbo].[GameActions_Get]
GO
/****** Object:  StoredProcedure [dbo].[Game_Add]    Script Date: 1/28/2015 6:41:15 AM ******/
DROP PROCEDURE [dbo].[Game_Add]
GO
/****** Object:  StoredProcedure [dbo].[Game_Add]    Script Date: 1/28/2015 6:41:15 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Game_Add]
	@GameId [nvarchar](50),
	@HostId [bigint],
	@ClientId [bigint],
	@MapId [nvarchar](50)
WITH EXECUTE AS CALLER
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	INSERT INTO Game (Guid, HostId, ClientId, StartTime, Map) VALUES(@GameId, @HostId, @ClientId, GETUTCDATE(), @MapId);
END



GO
/****** Object:  StoredProcedure [dbo].[GameActions_Get]    Script Date: 1/28/2015 6:41:15 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[GameActions_Get]
	@GameGuid [nvarchar](50)
WITH EXECUTE AS CALLER
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;
	SELECT GR.Actions,
	G.Map
	FROM GameReport AS GR
	JOIN Game AS G
	ON GR.GameId = G.Id
	WHERE @GameGuid = G.Guid 
END



GO
/****** Object:  StoredProcedure [dbo].[GameReport_Add]    Script Date: 1/28/2015 6:41:15 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[GameReport_Add]
	@GameGUID [nvarchar](50),
	@Reporter [bigint],
	@Winner [bigint],
	@Actions [nvarchar](max),
	@GameHash [bigint] = null
WITH EXECUTE AS CALLER
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @GameId bigint

	SELECT TOP 1 @GameId =  Id FROM Game WHERE @GameGUID = Guid

	INSERT INTO GameReport 
	(GameId, ReporterId, WinnerId, Actions, Date, GameHash ) 
	VALUES(@GameId, @Reporter, @Winner, @Actions, GETUTCDATE(), @GameHash)
END



GO
/****** Object:  StoredProcedure [dbo].[GameReports_Get]    Script Date: 1/28/2015 6:41:15 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[GameReports_Get]
	@StartTime [datetime] = NULL
WITH EXECUTE AS CALLER
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;
	SELECT G.id, 
		G.Guid, 
		G.Map, 
		U1.Username AS Host, 
		U2.Username AS Client, 
		G.StartTime, 
		GR.Actions, 
		GR.Date, 
		GR.GameHash--, 
	--	W.Username 
	FROM GameReport AS GR
	JOIN Game AS G
	ON GR.GameId = G.Id
	JOIN "User" AS U1
	ON U1.Id = G.HostId
	JOIN "User" AS U2
	ON U2.Id = G.ClientId
	--JOIN "User" AS W
	--ON W.Id = GR.WinnerId
	WHERE @StartTime IS NULL OR G.StartTime > @StartTime
	ORDER BY G.StartTime DESC
END



GO
/****** Object:  StoredProcedure [dbo].[LobbyUser_Get]    Script Date: 1/28/2015 6:41:15 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[LobbyUser_Get]
	@Socket [nvarchar](64) = NULL,
	@Username [nvarchar](64) = NULL
WITH EXECUTE AS CALLER
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;
	SELECT L.Id, L.UserId, L.Socket, U.Username 
	FROM LobbyUser AS L
		JOIN "User" AS U ON U.Id = L.UserId 
	WHERE 
		(@Socket IS NULL OR @Socket = L.Socket) AND
		(@Username IS NULL OR @Username = U.Username)
END



GO
/****** Object:  StoredProcedure [dbo].[LobbyUser_RemoveAll]    Script Date: 1/28/2015 6:41:15 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[LobbyUser_RemoveAll]
WITH EXECUTE AS CALLER
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;
	DELETE FROM dbo.LobbyUser;
END



GO
/****** Object:  StoredProcedure [dbo].[User_Add]    Script Date: 1/28/2015 6:41:15 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[User_Add]
	@Username [nvarchar](64),
	@Password [nvarchar](64),
	@Email [nvarchar](64)
WITH EXECUTE AS CALLER
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

    INSERT INTO "User" (Username, Password, Email) VALUES(@Username, @Password, @Email)
END



GO
/****** Object:  StoredProcedure [dbo].[User_AddToLobby]    Script Date: 1/28/2015 6:41:15 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[User_AddToLobby]
	@Username [varchar](max),
	@Socket [varchar](max)
WITH EXECUTE AS CALLER
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @UserId bigint

	SELECT TOP 1 @UserId =  Id FROM "User" WHERE @Username = Username

	INSERT INTO LobbyUser (UserId, Socket) VALUES(@UserId, @Socket)
END



GO
/****** Object:  StoredProcedure [dbo].[User_Get]    Script Date: 1/28/2015 6:41:15 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[User_Get]
	@Username [nvarchar](64)
WITH EXECUTE AS CALLER
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	SELECT Username FROM "User" WHERE Username = @Username
END



GO
/****** Object:  StoredProcedure [dbo].[User_GetAllInLobby]    Script Date: 1/28/2015 6:41:15 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[User_GetAllInLobby]
WITH EXECUTE AS CALLER
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;
	SELECT U.Id, U.Username, L.Socket 
	FROM LobbyUser AS L 
		JOIN "User" AS U ON L.UserId = U.Id
END



GO
/****** Object:  StoredProcedure [dbo].[User_Login]    Script Date: 1/28/2015 6:41:15 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[User_Login]
	@Username [nvarchar](64),
	@Password [nvarchar](64)
WITH EXECUTE AS CALLER
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

    SELECT Username FROM "User" WHERE @Username = Username AND @Password = Password
END



GO
/****** Object:  StoredProcedure [dbo].[User_RemoveFromLobby]    Script Date: 1/28/2015 6:41:15 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[User_RemoveFromLobby]
	@Socket [varchar](max)
WITH EXECUTE AS CALLER
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;
	DELETE FROM dbo.LobbyUser WHERE Socket = @Socket
END



GO
/****** Object:  Table [dbo].[Game]    Script Date: 1/28/2015 6:41:15 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Game](
	[Id] [bigint] IDENTITY(1,1) NOT NULL,
	[Guid] [nvarchar](50) NOT NULL,
	[StartTime] [datetime] NULL,
	[Map] [nvarchar](50) NULL,
	[HostId] [bigint] NULL,
	[ClientId] [bigint] NULL,
 CONSTRAINT [PK_Game] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF)
)

GO
/****** Object:  Table [dbo].[GameReport]    Script Date: 1/28/2015 6:41:15 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[GameReport](
	[Id] [bigint] IDENTITY(1,1) NOT NULL,
	[GameId] [bigint] NOT NULL,
	[Actions] [nvarchar](max) NOT NULL,
	[Date] [datetime] NOT NULL,
	[GameHash] [bigint] NULL,
	[WinnerId] [bigint] NULL,
	[ReporterId] [bigint] NULL,
 CONSTRAINT [PK_GameReport] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF)
)

GO
/****** Object:  Table [dbo].[LobbyUser]    Script Date: 1/28/2015 6:41:15 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[LobbyUser](
	[Id] [bigint] IDENTITY(1,1) NOT NULL,
	[UserId] [bigint] NOT NULL,
	[Socket] [nvarchar](64) NOT NULL,
 CONSTRAINT [PK_LobbyUser] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF)
)

GO
/****** Object:  Table [dbo].[User]    Script Date: 1/28/2015 6:41:15 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[User](
	[Id] [bigint] IDENTITY(1,1) NOT NULL,
	[Username] [nvarchar](64) NULL,
	[Password] [nvarchar](64) NULL,
	[Email] [nvarchar](64) NOT NULL,
 CONSTRAINT [PK_User] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF)
)

GO
